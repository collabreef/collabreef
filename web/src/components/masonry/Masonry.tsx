import { default as M } from "react-masonry-css";

interface Props {
    children: React.ReactNode
}
const Masonry = (props: Props) => {
    const breakpointColumns = {
        default: 3,
        1280: 2,
        640: 1,
    };

    return <M
        breakpointCols={breakpointColumns}
        className="flex max-w-full"
        columnClassName="masonry-grid_column"
    >
        {props.children}
    </M>
}

export default Masonry