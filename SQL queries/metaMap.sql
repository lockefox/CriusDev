SELECT  conv2.typeName	`T2 TypeName`, 
		conv2.typeID	`T2 typeID`, 
		conv1.typeName	`T1 TypeName`, 
		conv1.typeID	`T1 TypeID`, 
		probs.probability`InventionProb`, 
		prods2.quantity	`InventionBaseYield`,
		prods.quantity	`InventionQtyPerRun`
FROM industryactivitymaterials mats
JOIN industryActivityProducts prods ON (mats.typeID = prods.typeID AND prods.activityID=1)
JOIN industryActivityProducts prods2 on (prods2.typeID = prods.typeID and prods2.activityID=8)
JOIN industryactivityprobabilities probs ON (mats.typeID = probs.typeID AND probs.activityID=8)
JOIN invtypes conv1 on (prods.productTypeID = conv1.typeID)
JOIN invmetatypes meta on (conv1.typeID = meta.parenttypeid)
JOIN invtypes conv2 on (meta.typeID = conv2.typeID)
WHERE mats.activityID = 8
AND meta.metagroupID = 2
group by conv1.typeID, conv2.typeID