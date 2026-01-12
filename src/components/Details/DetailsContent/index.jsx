import styles from '../Details.module.scss';

export default function DetailsContent({ className, children }) {
    return (
        <div className={`${styles.detailsContent} ${className || ''}`}>
            <div>
                {children}
            </div>
        </div>
    );
}