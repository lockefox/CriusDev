#!/Python27/python.exe
##Designed to work with FuzzySteve's mySQL SDE dumps

import sqlite3 as lite
import MySQLdb
import getopt
import time
import sys

sqlite_con = None
sqlite_cur = None
mysql_con = None
mysql_cur = None

csv_filename = "bp_dump.csv"
csv_file = open(csv_filename,"w")

mysql_dbname = "kronos-1.0-98534"
mysql_dbhost = "127.0.0.1"
mysql_dbuser = "root"
mysql_dbpw   = "bar"
mysql_dbport = 3306

csvdump = False
mySQL_enabled = True

sqlite_defaultPath = "C:\\Program Files (x86)\\CCP\\Singularity\\bin\\staticdata\\blueprints.db"

material_table = "crius_BPOmaterials"
skill_table = "crius_BPOskills"
time_table = "crius_BPOtimes"

def SQLite_fetch():
	global sqlite_con, sqlite_cur
	
	try:
		sqlite_con = lite.connect(sqlite_defaultPath)
		
		sqlite_cur = sqlite_con.cursor()
		sqlite_cur.execute("SELECT * FROM cache")
		
		data = sqlite_cur.fetchall();
	
	except lite.Error, e:
		print "ERROR %s" % e
		sys.exit
		
	return data
	
def parseargs():
	global csvdump, mySQL_enabled, sqlite_defaultPath
	
	try:
		opts, args = getopt.getopt(sys.argv[1:],"h",["csv","noSQL","sqlsource="])
	except getopt.GetoptError:
		print "invalid arguments"
		sys.exit(2)
	
	for opt, arg in opts:
		if opt == "-h":
			print "--csv, --noSQL, --sqlsource="
		elif opt == "--csv":
			csvdump = True
		elif opt == "--sqlsource":
			sqlite_defaultPath = arg

def configMySQL():
	global mysql_con, mysql_cur
	
	mysql_con = MySQLdb.connect(host  = mysql_dbhost,\
								user  = mysql_dbuser, \
								passwd= mysql_dbpw,\
								port  = mysql_dbport, \
								db    = mysql_dbname)
	mysql_cur = mysql_con.cursor()
	
	### Configure fresh tables for data ###
	mysql_cur.execute('''DROP TABLE IF EXISTS `%s`''' % material_table)
	mysql_con.commit()
	mysql_cur.execute('''CREATE TABLE `%s`(
			`blueprintID` int(32) NOT NULL,
			`activityID`  int(32) NOT NULL,
			`materialID`  int(32) NOT NULL,
			`quantity`    int(32) NOT NULL DEFAULT 0,
			PRIMARY KEY (blueprintID,activityID,materialID))
		ENGINE=InnoDB DEFAULT CHARSET=latin1''' % material_table)
	mysql_con.commit()
	print "created %s table" % material_table 
	
	mysql_cur.execute('''DROP TABLE IF EXISTS `%s`''' % skill_table)
	mysql_con.commit()
	mysql_cur.execute('''CREATE TABLE `%s`(
			`blueprintID` int(32) NOT NULL,
			`activityID`  int(32) NOT NULL,
			`skillID`     int(32) NOT NULL,
			`skillLevel`  int(32) NOT NULL DEFAULT 0,
			PRIMARY KEY (blueprintID,activityID,skillID))
		ENGINE=InnoDB DEFAULT CHARSET=latin1''' % skill_table)
	mysql_con.commit()
	print "created %s table" % skill_table
	
	mysql_cur.execute('''DROP TABLE IF EXISTS `%s`''' % time_table)
	mysql_con.commit()
	mysql_cur.execute('''CREATE TABLE `%s`(
			`blueprintID` int(32) NOT NULL,
			`activityID`  int(32) NOT NULL,
			`time`        int(32) NOT NULL DEFAULT 0,
			PRIMARY KEY (blueprintID,activityID))
		ENGINE=InnoDB DEFAULT CHARSET=latin1''' % time_table)
	mysql_con.commit()
	print "created %s table" % time_table 
	
	
def main():
	parseargs()
	
	data = SQLite_fetch()
	
	if csvdump:
		print "dumping SQLite to CSV %s" % csv_filename
		csv_file.write("key,value,time,\n")	
		for row in data:
			csv_file.write("%s,%s,%s,\n" %(row[0],row[1],row[2]))
	
	if mySQL_enabled:
		global mysql_con, mysql_cur
		configMySQL()
		
if __name__ == "__main__":
	main()