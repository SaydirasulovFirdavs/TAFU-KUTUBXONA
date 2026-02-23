import './Skeleton.css';

const Skeleton = ({ type = 'text', width, height, className = '' }) => {
    const style = {
        width: width || (type === 'title' ? '60%' : type === 'text' ? '100%' : '100%'),
        height: height || (type === 'title' ? '24px' : type === 'text' ? '16px' : type === 'image' ? '300px' : '16px')
    };

    return (
        <div
            className={`skeleton-base skeleton-${type} ${className}`}
            style={style}
        >
            <div className="skeleton-shimmer"></div>
        </div>
    );
};

export default Skeleton;
