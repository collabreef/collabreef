import * as Y from 'yjs'

/**
 * Database persistence extension for Hocuspocus
 *
 * Handles loading documents from the database (onLoadDocument)
 * and storing them back (onStoreDocument) with debouncing.
 *
 * Document naming convention:
 *   note:{noteId}         - Note documents
 *   whiteboard:{viewId}   - Whiteboard documents
 *   spreadsheet:{viewId}  - Spreadsheet documents
 */
export class DatabaseExtension {
  constructor({ db }) {
    this.db = db
  }

  /**
   * Parse documentName into { type, id }
   */
  parseDocumentName(documentName) {
    const colonIdx = documentName.indexOf(':')
    if (colonIdx === -1) {
      return { type: 'unknown', id: documentName }
    }
    return {
      type: documentName.substring(0, colonIdx),
      id: documentName.substring(colonIdx + 1),
    }
  }

  /**
   * Called when a document is loaded (first client connects to a room)
   * Loads Y.js binary state from DB, or initializes from existing data
   */
  async onLoadDocument(data) {
    const { documentName, document } = data
    const { type, id } = this.parseDocumentName(documentName)

    try {
      // Try loading existing Y.js binary state
      const yjsDoc = await this.db.getYjsDocument(documentName)
      if (yjsDoc && yjsDoc.data) {
        const update = yjsDoc.data instanceof Buffer
          ? new Uint8Array(yjsDoc.data)
          : new Uint8Array(yjsDoc.data)
        Y.applyUpdate(document, update)

        // Clear stale ops array from previous sessions (spreadsheets use Y.Array('ops')
        // for real-time forwarding; these are no longer needed after persistence)
        const yOps = document.getArray('ops')
        if (yOps.length > 0) {
          yOps.delete(0, yOps.length)
        }

        return
      }

      // No Y.js state - initialize from existing data in original tables
      switch (type) {
        case 'note':
          await this.initializeNote(document, id)
          break
        case 'whiteboard':
          await this.initializeWhiteboard(document, id)
          break
        case 'spreadsheet':
          await this.initializeSpreadsheet(document, id)
          break
        default:
          break
      }
    } catch (err) {
      console.error(`[DB] Error loading document ${documentName}:`, err)
    }
  }

  /**
   * Called after document changes (debounced by Hocuspocus)
   * Saves Y.js binary state and extracts human-readable data to original tables
   */
  async onStoreDocument(data) {
    const { documentName, document } = data
    const { type, id } = this.parseDocumentName(documentName)
    const now = new Date().toISOString()

    try {
      // Save Y.js binary state
      const state = Y.encodeStateAsUpdate(document)
      await this.db.saveYjsDocument(documentName, Buffer.from(state), now)

      // Extract and save human-readable data to original tables
      switch (type) {
        case 'note':
          await this.persistNote(document, id, data)
          break
        case 'whiteboard':
          await this.persistWhiteboard(document, id)
          break
        case 'spreadsheet':
          await this.persistSpreadsheet(document, id)
          break
      }

    } catch (err) {
      console.error(`[DB] Error storing document ${documentName}:`, err)
    }
  }

  /**
   * Initialize a note Y.Doc from the notes table
   */
  async initializeNote(document, noteId) {
    const note = await this.db.findNote(noteId)
    if (!note) {
      return
    }

    document.transact(() => {
      // Set content
      const yText = document.getText('content')
      if (note.content) {
        yText.insert(0, note.content)
      }

      // Set metadata
      const yMeta = document.getMap('meta')
      yMeta.set('title', note.title || '')
    })

  }

  /**
   * Initialize a whiteboard Y.Doc from views + view_objects tables
   */
  async initializeWhiteboard(document, viewId) {
    const view = await this.db.findView(viewId)
    if (!view) {
      return
    }

    document.transact(() => {
      // Load canvas objects from views.data
      const canvasObjects = document.getMap('canvas-objects')
      if (view.data) {
        try {
          const parsed = JSON.parse(view.data)
          if (parsed && typeof parsed === 'object') {
            for (const [key, value] of Object.entries(parsed)) {
              canvasObjects.set(key, value)
            }
          }
        } catch (e) {
          console.error(`[DB] Error parsing whiteboard canvas data:`, e)
        }
      }

      // Load view objects from view_objects table
      // Note: This is done outside the transact if async
    })

    // Load view objects (async DB call)
    try {
      const viewObjects = await this.db.findViewObjectsByViewId(viewId)
      if (viewObjects && viewObjects.length > 0) {
        document.transact(() => {
          const yViewObjects = document.getMap('view-objects')
          for (const obj of viewObjects) {
            yViewObjects.set(obj.id, {
              id: obj.id,
              type: obj.type,
              name: obj.name,
              data: obj.data,
              created_by: obj.created_by,
              updated_by: obj.updated_by,
              created_at: obj.created_at,
              updated_at: obj.updated_at,
            })
          }
        })
      }
    } catch (e) {
      console.error(`[DB] Error loading view objects:`, e)
    }

  }

  /**
   * Initialize a spreadsheet Y.Doc from views.data
   */
  async initializeSpreadsheet(document, viewId) {
    const view = await this.db.findView(viewId)
    if (!view) {
      return
    }

    if (view.data) {
      try {
        const parsed = JSON.parse(view.data)
        document.transact(() => {
          const ySpreadsheet = document.getMap('spreadsheet')
          if (Array.isArray(parsed)) {
            // Data is an array of sheets
            for (const sheet of parsed) {
              if (sheet.id) {
                ySpreadsheet.set(sheet.id, sheet)
              }
            }
          } else if (parsed && typeof parsed === 'object') {
            // Data is a map of sheets
            for (const [key, value] of Object.entries(parsed)) {
              ySpreadsheet.set(key, value)
            }
          }
        })
      } catch (e) {
        console.error(`[DB] Error parsing spreadsheet data:`, e)
      }
    }

  }

  /**
   * Persist note Y.Doc back to notes table
   */
  async persistNote(document, noteId, data) {
    const yText = document.getText('content')
    const yMeta = document.getMap('meta')

    const content = yText.toString()
    const title = yMeta.get('title')
    const now = new Date().toISOString()

    // Get the user who made the last change from request headers
    const updatedBy = data.requestHeaders?.['x-user-id'] || 'system'

    const note = await this.db.findNote(noteId)
    if (!note) return

    await this.db.updateNote(noteId, {
      title: title !== undefined ? title : note.title,
      content,
      updated_at: now,
      updated_by: updatedBy,
    })
  }

  /**
   * Persist whiteboard Y.Doc back to views + view_objects tables
   */
  async persistWhiteboard(document, viewId) {
    const canvasObjects = document.getMap('canvas-objects')
    const yViewObjects = document.getMap('view-objects')
    const now = new Date().toISOString()

    // Save canvas objects to views.data
    const canvasData = {}
    canvasObjects.forEach((value, key) => {
      canvasData[key] = value
    })
    await this.db.updateViewData(viewId, JSON.stringify(canvasData), now)

    // Sync view objects to view_objects table
    const currentViewObjects = {}
    yViewObjects.forEach((value, key) => {
      currentViewObjects[key] = value
    })

    const dbObjects = await this.db.findViewObjectsByViewId(viewId)
    const dbObjectIds = new Set(dbObjects.map(o => o.id))
    const currentIds = new Set(Object.keys(currentViewObjects))

    // Delete objects no longer in Y.js
    for (const obj of dbObjects) {
      if (!currentIds.has(obj.id)) {
        await this.db.deleteViewObject(obj.id)
      }
    }

    // Create or update objects from Y.js
    for (const [id, obj] of Object.entries(currentViewObjects)) {
      if (dbObjectIds.has(id)) {
        await this.db.updateViewObject(id, {
          name: obj.name || '',
          type: obj.type || '',
          data: typeof obj.data === 'string' ? obj.data : JSON.stringify(obj.data || {}),
          updated_by: obj.updated_by || 'system',
          updated_at: now,
        })
      } else {
        await this.db.createViewObject({
          id,
          view_id: viewId,
          name: obj.name || '',
          type: obj.type || '',
          data: typeof obj.data === 'string' ? obj.data : JSON.stringify(obj.data || {}),
          created_by: obj.created_by || 'system',
          updated_by: obj.updated_by || 'system',
          created_at: obj.created_at || now,
          updated_at: now,
        })
      }
    }
  }

  /**
   * Persist spreadsheet Y.Doc back to views.data
   */
  async persistSpreadsheet(document, viewId) {
    const ySpreadsheet = document.getMap('spreadsheet')
    const now = new Date().toISOString()

    const sheetsArray = []
    ySpreadsheet.forEach((value, key) => {
      if (!key.startsWith('_')) {
        sheetsArray.push(value)
      }
    })
    sheetsArray.sort((a, b) => (a.order || 0) - (b.order || 0))

    await this.db.updateViewData(viewId, JSON.stringify(sheetsArray), now)
  }
}
