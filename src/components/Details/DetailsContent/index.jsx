import styles from '../Details.module.css';

export default function DetailsContent({ className, children }) {
    return (
        <div className={`${styles.detailsContent} ${className || ''}`}>
            <div>
                {children}
            </div>
        </div>
    );
}