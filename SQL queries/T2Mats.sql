SELECT conv1.typeName, times.time, mats.materialtypeID, conv2.groupID, conv2.typeName,mats.quantity
FROM industryactivitymaterials mats
JOIN industryactivityproducts prods ON (mats.typeID=prods.typeID)
JOIN industryactivity times ON (times.typeID = mats.typeID AND times.activityID=1) -- only get mfg times
JOIN invtypes conv1 on (conv1.typeID = prods.productTypeID)
JOIN invtypes conv2 on (conv2.typeID = mats.materialTypeID)
JOIN invgroups grp2 on (conv2.groupID = grp2.groupID)
JOIN invmetatypes meta on (conv1.typeID = meta.typeID)
WHERE conv1.marketGroupID IS NOT null
AND meta.metagroupID =2
AND grp2.categoryID NOT IN (6,7,18) -- filter out T1 items for reasons
AND conv1.groupID NOT IN (773, 774, 775, 776, 777, 778, 779, 781, 782, 786, 787,1233, 1223) -- filter out rigs
AND mats.activityID = 1  