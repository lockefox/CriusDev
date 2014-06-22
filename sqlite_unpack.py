#!/Python27/python.exe

import sqlite3 as lite
import sys

con = None
log = open("bp_dump.csv","w")

try:
	con = lite.connect('blueprints.db')
	
	cur = con.cursor()
	cur.execute("SELECT * FROM cache")
	
	data = cur.fetchall();

except lite.Error, e:
	print "ERROR %s" % e
	sys.exit

log.write("key,value,time,\n")	
for row in data:
	log.write("%s,%s,%s,\n" %(row[0],row[1],row[2]))
	