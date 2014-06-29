#!/Python27/python.exe
##Designed to work with FuzzySteve's mySQL SDE dumps

import sqlite3 as lite
import MySQLdb
import getopt
import sys

sqlite_con = None
sqlite_cur = None
mysql_con = None
mysql_cur = None

csv_file = open("bp_dump.csv","w")

csvdump = False
mySQL_enabled = True

sqlite_defaultPath = "C:\\Program Files (x86)\\CCP\\Singularity\\bin\\staticdata\\blueprints.db"

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
	
if csvdump:
	csv_file.write("key,value,time,\n")	
	for row in data:
		csv_file.write("%s,%s,%s,\n" %(row[0],row[1],row[2]))
	

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
		if opt == "--csv":
			csvdump = True


def main():
	parseargs()
	
	data = SQLite_fetch()
	
	if csvdump:
		csv_file.write("key,value,time,\n")	
		for row in data:
			csv_file.write("%s,%s,%s,\n" %(row[0],row[1],row[2]))
		
if __name__ == "__main__":
	main()