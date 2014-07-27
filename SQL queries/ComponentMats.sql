SELECT conv1.typeName, times.time, mats.materialtypeID, conv2.groupID, conv2.typeName,mats.quantity
FROM industryactivitymaterials mats
JOIN industryactivityproducts prods ON (mats.typeID=prods.typeID)
JOIN industryactivity times ON (times.typeID = mats.typeID AND times.activityID=1) -- only get mfg times
JOIN invtypes conv1 on (conv1.typeID = prods.productTypeID)
JOIN invtypes conv2 on (conv2.typeID = mats.materialTypeID)
JOIN invgroups grp2 on (conv2.groupID = grp2.groupID)
WHERE conv1.marketGroupID IS NOT null
AND conv1.groupID IN (334,913)
AND mats.activityID = 1  