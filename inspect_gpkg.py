from osgeo import ogr
ds = ogr.Open('/data/tellekretser_kystkontur.gpkg')
for i in range(ds.GetLayerCount()):
    lyr = ds.GetLayer(i)
    defn = lyr.GetLayerDefn()
    srs = lyr.GetSpatialRef()
    print('Layer:', lyr.GetName())
    print('EPSG:', srs.GetAuthorityCode(None) if srs else 'None')
    print('Count:', lyr.GetFeatureCount())
    print('Fields:', [(defn.GetFieldDefn(j).GetName(), defn.GetFieldDefn(j).GetTypeName()) for j in range(defn.GetFieldCount())])
