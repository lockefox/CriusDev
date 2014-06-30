SELECT	it1.typeid baseid,
		it1.typename basename,
		it2.typeid basebpid,
		it2.typename basebpname,
		it3.typeid t2id,
		it3.typename t2name,
		it4.typeid t2bpid,
		it4.typename t2bpname,
		
FROM invTypes it1
JOIN invBlueprintTypes ibt1 ON it1.typeid=ibt1.producttypeid
JOIN invTypes it2 ON it2.typeid=ibt1.blueprinttypeid
JOIN invMetaTypes imt ON imt.parenttypeid=it1.typeid
JOIN invTypes it3 ON imt.typeid=it3.typeid
JOIN invBlueprintTypes ibt2 ON it3.typeid=ibt2.producttypeid
JOIN invTypes it4 ON it4.typeid=ibt2.blueprinttypeid
JOIN invgroups grp ON (grp.typeid = it4.typeid AND attributeID=1112)
WHERE imt.metaGroupID=2;