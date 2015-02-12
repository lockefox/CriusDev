SELECT  fconv.typeName,
	prTime.time AS `productionTime`,
	teTime.time AS `researchProductivityTime`,
	meTime.time AS `researchMaterialTime`,
	cpTime.time AS `researchCopyTime`, 
	ivTime.time AS `inventionTime`
FROM industryBlueprints bp
LEFT JOIN industryActivity prTime ON (bp.typeID = prTime.typeID AND prTime.activityID = 1)
LEFT JOIN industryActivity teTime ON (bp.typeID = teTime.typeID AND teTime.activityID = 3)
LEFT JOIN industryActivity meTime ON (bp.typeID = meTime.typeID AND meTime.activityID = 4)
LEFT JOIN industryActivity cpTime ON (bp.typeID = cpTime.typeID AND cpTime.activityID = 5)
LEFT JOIN industryActivity ivTime ON (bp.typeID = ivTime.typeID AND ivTime.activityID = 8)
LEFT JOIN industryActivityProducts p ON (bp.typeID = p.typeID AND p.activityID = 1)
JOIN invtypes fconv on (fconv.typeid = p.productTypeID)
WHERE fconv.marketgroupid IS NOT NULL

-- CREDIT TO: https://github.com/evecm/ecm/blob/master/ecm/admin/cmd/fuzzwork_patch_mysql.sql#L87
