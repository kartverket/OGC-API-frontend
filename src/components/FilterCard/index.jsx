import { Card, Heading, Label, Select, Field, Options, Button } from '@digdir/designsystemet-react';
import { FilterIcon, EqualsIcon } from '@navikt/aksel-icons';
import styles from './FilterCard.module.scss';
import { getCrsCode } from '@/utils/helper';

export default function FilterCard({ collection }) {
    return (
        <Card className={styles.filterCard}>
            <div className={styles.heading}>
                <FilterIcon title="a11y-title" fontSize="24px" />
                <Heading data-size="2xs">Filter for {collection.title}</Heading>
            </div>

            <div className={styles.filter}>
               
                
                <div className={styles.filters}>
                    <Field>
                    <Label htmlFor="crs-select" size="small">Felt</Label>
                    <Select label="Select CRS" size="small" defaultValue={getCrsCode(collection?.crs?.[0])}>
                        {collection?.crs?.map((crs) => (
                            <Select.Option key={crs} value={getCrsCode(crs)}>
                                {getCrsCode(crs)}
                            </Select.Option>
                        ))}
                    </Select>  
                    </Field>
                    <div className={styles.icon}>
                        <EqualsIcon title="a11y-title" fontSize="24px" />
                   </div>
                    <Field>                                                                       
                    <Label htmlFor="crs-select" size="small">Felt</Label>
                    <Select label="Select CRS" size="small" defaultValue={getCrsCode(collection?.crs?.[0])}>
                        {collection?.crs?.map((crs) => (
                            <Select.Option key={crs} value={getCrsCode(crs)}>
                                {getCrsCode(crs)}
                            </Select.Option>
                        ))}
                    </Select>                   
                    </Field>
                </div>
                <div className={styles.pattern}>
               <Field>
                    <Label htmlFor="crs-select" size="small">Filter pattern</Label>
                    <Select label="Select CRS" width="full" size="small" defaultValue={getCrsCode(collection?.crs?.[0])}>
                        {collection?.crs?.map((crs) => (
                            <Select.Option key={crs} value={getCrsCode(crs)}>
                                {getCrsCode(crs)}
                            </Select.Option>
                        ))}
                    </Select>               
                </Field>
                <Button variant="primary" size="small" className={styles.applyButton}>Ta i bruk BBOX filter</Button>
                </div>
            </div>
                                   
        </Card>
    )
}