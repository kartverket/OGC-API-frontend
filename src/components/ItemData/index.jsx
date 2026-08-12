import ItemDataProperty from './ItemDataProperty';
import styles from './ItemData.module.css';

export default function ItemData({ data }) {
    return (
        <div className={styles.itemData}>
            <div>
                <div className={`${styles.row} ${styles.header}`}>
                    <div>Egenskap</div>
                    <div>Verdi</div>
                </div>

                <ItemDataProperty data={data.properties} />
            </div>
        </div>
    );
}
