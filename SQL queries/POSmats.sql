SELECT	conv1.typeName as `Product`, 
		conv1.typeid as `ProdID`, 
		conv1.groupid as `ProdGrp`, 
		times.time, 
		conv2.typeName as `Material`,
		mats.materialtypeID as `MatID`, 
		conv2.groupID as `MatGrp`, 
		mats.quantity,
		prods.quantity as `yield`
FROM industryactivitymaterials mats
JOIN industryactivityproducts prods ON (mats.typeID=prods.typeID)
JOIN industryactivity times ON (times.typeID = mats.typeID AND times.activityID=1) -- only get mfg times
JOIN invtypes conv1 on (conv1.typeID = prods.productTypeID)
JOIN invtypes conv2 on (conv2.typeID = mats.materialTypeID)
JOIN invgroups grp2 on (conv2.groupID = grp2.groupID)
JOIN invgroups grp1 on (conv1.groupID = grp1.groupID)
LEFT JOIN invmetatypes meta on (conv1.typeID = meta.parentTypeID)
LEFT JOIN dgmTypeAttributes dgm1692 ON (conv1.typeid = dgm1692.typeid AND dgm1692.attributeid = 1692) 
WHERE conv1.marketGroupID IS NOT null
AND mats.activityID = 1
AND grp1.categoryid = 23
AND COALESCE(dgm1692.valueint, dgm1692.valuefloat, 0) = 0
