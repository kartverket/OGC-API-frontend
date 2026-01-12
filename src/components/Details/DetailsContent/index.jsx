import styles from '../Details.module.css';

export default function DetailsContent({ children }) {
    return (
        <div className={styles.detailsContent}>
            <div>
                {children}
            </div>
        </div>
    );
}