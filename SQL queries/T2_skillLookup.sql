SELECT bp_conv.typeName,
	skill_conv.typeName AS `skillName`,
	skills.level AS `requiredLevel`
FROM industryactivityskills skills
JOIN invtypes skill_conv ON (skills.skillID = skill_conv.typeid)
JOIN industryactivityproducts prods ON (prods.typeid = skills.typeid AND prods.activityid = 1)
JOIN invtypes bp_conv ON (prods.productTypeID = bp_conv.typeid)

WHERE (skill_conv.groupID = 270 OR skill_conv.typeid IN (3395,3396,3397,3398,22242))
AND skill_conv.typeID NOT IN (3403,3409,3402,20433,21789,23123,23124)
