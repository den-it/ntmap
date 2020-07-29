import psycopg2
import configparser

    
def queryDB(connectStr, query, args=(), one=False):
    try:
        cur = psycopg2.connect(connectStr).cursor()
        cur.execute(query, args)
        r = [dict((cur.description[i][0], value) \
                   for i, value in enumerate(row)) for row in cur.fetchall()]
        cur.connection.close()
        rows = (r[0] if r else None) if one else r
        return { "result": "success", "rows": rows }
    except(Exception, psycopg2.Error) as error:
        return { "result": str(error) }
        

def insertToDB(connectStr, query):
    try:
        cur = psycopg2.connect(connectStr).cursor()
        cur.execute(query)
        cur.connection.commit()
        count = cur.rowcount
        if count == 0:
            return { "result": "Affected 0 rows" }
        cur.close()
        cur.connection.close()
        return { "result": "success" }
    except(Exception, psycopg2.Error) as error:
        return { "result": str(error) }
        

def deleteFromDB(connectStr, query, checkAffectedRows=False):
    try:
        cur = psycopg2.connect(connectStr).cursor()
        cur.execute(query)
        cur.connection.commit()
        count = cur.rowcount
        if (checkAffectedRows):
            if not (count):
                return { "result": "Nothing to delete. No object with such ID in DB" }
        cur.close()
        cur.connection.close()
        return { "result": "success" }
    except(Exception, psycopg2.Error) as error:
        return { "result": str(error) }


# Returns a list from a ConfigParser option. By default, splits on a comma and strip whitespaces.
def getOptionList(option, sep=',', chars=None):
    return [ chunk.strip(chars) for chunk in option.split(sep) ]


config = configparser.ConfigParser()
config.read("app/settings.ini")
