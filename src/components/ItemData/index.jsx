import ItemDataProperty from './ItemDataProperty';
import styles from './ItemData.module.css';

export default function ItemData({ data }) {
    const { [data.idField]: _, ...properties } = data.properties;

    return (
        <div className={styles.itemData}>
            <div>
                <div className={`${styles.row} ${styles.header}`}>
                    <div>Egenskap</div>
                    <div>Verdi</div>
                </div>

                <div className={styles.row}>
                    <div className={styles.label}>id</div>
                    <div className={styles.value}>{data.id}</div>
                </div>

                <ItemDataProperty data={properties} />
            </div>
        </div>
    );
}
