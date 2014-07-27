SELECT conv2.typeName, times.time, mats.materialtypeid, conv3.groupID, conv3.typeName,mats.quantity
FROM industryactivitymaterials mats
JOIN industryActivityProducts prods ON (mats.typeID = prods.typeID AND prods.activityID=1)
JOIN industryactivity times on (times.typeID = mats.typeID AND times.activityID=8)
JOIN invtypes conv1 on (prods.producttypeID = conv1.typeID)
JOIN invmetatypes meta on (conv1.typeID = meta.parenttypeid)
JOIN invtypes conv2 on (meta.typeID = conv2.typeID)
JOIN invtypes conv3 on (mats.materialTypeID = conv3.typeID)
WHERE mats.activityID=8
AND mats.consume = 1
AND meta.metagroupid = 2
AND conv2.marketgroupID IS NOT NULL
