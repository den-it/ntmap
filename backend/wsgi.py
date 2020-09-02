import json
import re
from functools import cmp_to_key
from urllib import parse
import sys
import app.common


def application(env, start_response):
    start_response("200 OK", [("Content-Type", "application/json")])
    urlList = re.findall("[^/]+", env["PATH_INFO"])
    params = parse.parse_qs(env["QUERY_STRING"])
    jsn = {}

    if urlList:
        if urlList[0] in ["l1maps", "l1map", "updategroup", "updatemap", "deletegroup", "deletemap"]:
            if urlList[0] == "l1maps":
                jsn = getMaps()
            
            
            elif urlList[0] == "l1map":
                if params and "id" in params:
                    id = re.search("^\d+$", params["id"][0])
                    if id:
                        jsn = getMap(id.group())
                    else:
                        jsn = { "result": "Wrong map ID" }
                else:
                        jsn =  { "result": "No map ID given" }
            
            
            elif urlList[0] == "updategroup":
                postvars = parse.parse_qs(env['wsgi.input'].readline().decode(),True)
                if postvars and "id" in postvars and "name" in postvars:
                    id = re.search("^\d+$", postvars["id"][0])
                    name = postvars["name"][0]
                    if id and name:
                        jsn = updateGroup(id.group(), name)
                    else:
                        jsn =  { "result": "Input parameters error" }
                else:
                    jsn =  { "result": "Insufficient input parameters" }
                    
                    
            elif urlList[0] == "deletegroup":
                if params and "id" in params:
                    id = re.search("^\d+$", params["id"][0])
                    if id:
                        jsn = deleteGroup(id.group())
                    else:
                        jsn =  { "result": "Wrong group ID" }
                else:
                        jsn =  { "result": "No group ID given" }


            elif urlList[0] == "updatemap":
                postvars = parse.parse_qs(env['wsgi.input'].readline().decode(),True)
                if postvars and "id" in postvars and "name" in postvars and "group" in postvars and "scheme" in postvars:
                    id = re.search("^\d+$", postvars["id"][0])
                    group = re.search("^\d+$", postvars["group"][0])
                    name = postvars["name"][0]
                    scheme = postvars["scheme"][0]
                    if id and group and name and scheme:
                        jsn = updateMap(id.group(), group.group(), name, scheme)
                    else:
                        jsn =  { "result": "Input parameters error" }
                else:
                    jsn =  { "result": "Insufficient input parameters" }


            elif urlList[0] == "deletemap":
                if params and "id" in params:
                    id = re.search("^\d+$", params["id"][0])
                    if id:
                        jsn = deleteMap(id.group())
                    else:
                        jsn =  { "result": "Wrong map ID" }
                else:
                        jsn =  { "result": "No map ID given" }


        else: 
            jsn =  { "result": "Page not found" }
    
    else:
        jsn =  { "result": "Ntmap API" }

    return [bytes(json.dumps(jsn, indent=4, sort_keys=True), "utf-8")]




################################################################################
def deleteMap(mapID):
    result = app.common.deleteFromDB(app.common.config["ntmap"]["db"], "DELETE FROM ntmap_l1_maps WHERE id=" + str(mapID) + ";", True)

    return result


################################################################################
def updateMap(mapID, groupID, mapName, mapScheme):
    try:
        mapSchemeDict = json.loads(mapScheme)
    except json.decoder.JSONDecodeError as err:
        return { "result": "Scheme is not a valid JSON: " + str(err) + ": " +str(mapScheme) }

    if int(mapID):
        result = app.common.insertToDB(app.common.config["ntmap"]["db"], "UPDATE ntmap_l1_maps SET name='" + mapName +  "', group_id=" + str(groupID)  + ", scheme='" + mapScheme + "' WHERE id=" + str(mapID) + ";")
    else:
        result = app.common.insertToDB(app.common.config["ntmap"]["db"], "INSERT INTO ntmap_l1_maps (name, group_id, scheme) VALUES ('" + mapName + "', " + str(groupID) + ", '" + mapScheme + "');")

    return result
 
    
################################################################################
def deleteGroup(id):
    groupID = int(id)
    
    result = app.common.deleteFromDB(app.common.config["ntmap"]["db"], "DELETE FROM ntmap_l1_maps WHERE group_id=" + str(groupID) + ";")
    if (result["result"] == "success"):
        result = app.common.deleteFromDB(app.common.config["ntmap"]["db"], "DELETE FROM ntmap_l1_groups WHERE id=" + str(groupID) + ";", True)

    return result


################################################################################
def updateGroup(groupID, groupName):
    if int(groupID) == 0:
        result = app.common.insertToDB(app.common.config["ntmap"]["db"], "INSERT INTO ntmap_l1_groups (name) VALUES ('" + groupName + "');")
    else:
        result = app.common.insertToDB(app.common.config["ntmap"]["db"], "UPDATE ntmap_l1_groups SET name='" + groupName +  "' WHERE id=" + str(groupID) + ";")
 
    return result



################################################################################
def getMaps():
    ntmaps = []
    
    result = app.common.queryDB(app.common.config["ntmap"]["db"], "SELECT * FROM ntmap_l1_groups ORDER BY name")
    
    if not result["result"] == "success":
        return result
    
    groups = result["rows"]
    
    for gr in groups:
        mapsResult = app.common.queryDB(app.common.config["ntmap"]["db"], "SELECT * FROM ntmap_l1_maps WHERE group_id = " + str(gr["id"]) + " ORDER BY name")
        
        if not mapsResult["result"] == "success":
            return mapsResult

        groupDict = {}
        groupDict["group"] = gr["name"]
        groupDict["id"] = gr["id"]
        groupDict["maps"] = mapsResult["rows"]
        
        ntmaps.append(groupDict)

    return { "result": "success", "results": ntmaps }




################################################################################
   
# Converts interface speed from text string into numeric value measured in gigabits per second
# Example input: "10gbase-x-sfpp"
# Example output: 10
#
# Possible inputs:
# 100base-tx
# 1000base-t
# 1000base-x-sfp
# 10gbase-x-sfpp
# 10gbase-t
# 10gbase-x-xfp
# 25gbase-x-sfp28
# 40gbase-x-qsfpp
# 100gbase-x-cfp
def getLinkSpeedOutOfFormFactor(formFactor):
    if not (formFactor):
        return float(-1.0)

    if (re.search("^100base", formFactor)):
        return float(0.1)
        
    if (re.search("^1000base", formFactor)):
        return float(1.0)

    speed = re.search(".+gbase", formFactor)
    if (speed):
        speedInShortFormat = re.search("\d+", speed.group(0))
        return float(speedInShortFormat.group(0))
    
    return None


# Takes two adjacent interfaces speed (float) and returns link speed (float)
# TODO: do it gently, considering optics and copper differencies. Do not allow to make a cable between copper and optical ports
def getLinkSpeedOutOfTwoInterfacesSpeed(intAspeed, intBspeed):
    if intAspeed > 0:
        if intBspeed > 0:
            linkSpeed = min(intAspeed, intBspeed)
        else:
            linkSpeed = intAspeed
    else:
        if intBspeed > 0:
            linkSpeed = intBspeed
        else:
            linkSpeed = -1.0
    
    return linkSpeed

# Checks if given referencePattern is the longest match for device name amoung all text patterns
def isLongestMatch(name, referencePattern, patternsDict):
    isLongest = True
    for level in patternsDict.keys():
        for pattern in patternsDict[level]:
            if (pattern in name and referencePattern in pattern and referencePattern != pattern):
                isLongest = False
    return isLongest


# Sorts interfaces better. Example: gi1/1, gi1/2, gi1/11 (not gi1/1, gi1/11, gi1/2!)
def interfaceComparator(x, y):
    
    xChunks = re.findall("\D+|\d+", x["name"])
    yChunks = re.findall("\D+|\d+", y["name"])

    for i in range(len(xChunks)):
        if len(yChunks) > i:
            if not xChunks[i] == yChunks[i]:
                if re.findall("\D+", xChunks[i]): 
                    return xChunks[i] > yChunks[i]
                else:
                    if int(xChunks[i]) > int(yChunks[i]):
                        return 1
                    else:
                        return -1
        else:
            return 1

    return 0    
    
    
def getMap(id):
    graphJson = {"result": "", "results": { "nodes": [], "links": [], "mng_links": [],"interfaces": {} } }

    res = app.common.queryDB(app.common.config["ntmap"]["db"], "SELECT * FROM ntmap_l1_maps WHERE id=" + str(id))
    
    if not res["result"] == "success":
        return res
    
    if not len(res["rows"]):
        return { "result": "No map with id " + id }
    
    selectedMap = res["rows"]
    
    if selectedMap:
        selectedMapStr = selectedMap[0]
        selectedMapScheme = json.loads(selectedMapStr["scheme"])
        
        # Make a machine-friendly dictionary from user-friendly dictionary:
        # user-friendly:      { "1": "msk2-br0", "2": "msk2-core-sw, i43" }
        # machine-friendly:   { "1": "msk2-br0", "2": [ "msk2-core-sw", "i43"] }
        goodLevelsDict = {}
        for level in selectedMapScheme: 
            textPatterns = selectedMapScheme[level].split(",")
            for i, value in enumerate(textPatterns):
                textPatterns[i] = textPatterns[i].strip()
            goodLevelsDict.update({level: textPatterns})
        
        # For each level...
        for level in goodLevelsDict.keys():
            # ...and each pattern in the level get devices from Netbox with names matching the pattern
            for namePattern in goodLevelsDict[level]:
                sql =   """SELECT
                                d.name AS id,
                                d.id AS netbox_id,
                                d.serial AS serial,
                                vc.name AS virtual_chassis,
                                vc.id AS virtual_chassis_id,
                                c.name AS cluster,
                                r.name AS type,
                                t.model AS model,
                                m.name AS manufacturer
                            FROM 
                                dcim_device d
                            LEFT JOIN 
                                dcim_devicerole r
                                ON d.device_role_id = r.id
                            LEFT JOIN 
                                virtualization_cluster c
                                ON d.cluster_id = c.id
                            LEFT JOIN 
                                dcim_virtualchassis vc
                                ON d.virtual_chassis_id = vc.id
                            INNER JOIN 
                                dcim_devicetype t
                                ON d.device_type_id = t.id 
                            INNER JOIN 
                                dcim_manufacturer m
                                ON t.manufacturer_id = m.id 
                            WHERE
                                d.name LIKE '%%{}%%';""".format(namePattern)

                resDevices = app.common.queryDB(app.common.config["netbox"]["db"], sql)
                
                if not resDevices["result"] == "success":
                    return resDevices
                
                devices = resDevices["rows"]
                
                if devices and len(devices):
                    for device in devices:
                        # add found device to final graphJson only if text pattern in the current level is the longest match
                        # we need this not to add one device several times on different levels of the map
                        if (isLongestMatch(device["id"], namePattern, goodLevelsDict)):  
                            device["group"] = level
                            graphJson["results"]["nodes"].append(device)
                            
                            # check that number of devices to be displayed on one level is not too big
                            nn = [n["id"] for n in graphJson["results"]["nodes"] if n["group"] == level]
                            if len(nn) > int(app.common.config["ntmap"]["max_devices_at_one_level"]):
                                return { "result": "Too many devices (>" + app.common.config["ntmap"]["max_devices_at_one_level"] + ") matched the pattern of this map (\"" + namePattern + "\")" }
        
        if not graphJson["results"]["nodes"]:
            return { "result": "No devices matched the patterns of this map" }

        # form interfaces json
        for node in graphJson["results"]["nodes"]:
            sql = """SELECT
                            d.name as device,
                            i.id AS netbox_id,
                            i.name AS name,
                            i.mgmt_only AS mgmt_only,
                            i.lag_id AS lag_netbox_id,
                            l.name AS lag,
                            i.type AS type,
                            i.description AS description,
                            i._connected_interface_id AS neighbor_interface_netbox_id,
                            ni.name AS neighbor_interface,
                            ni.type AS neighbor_interface_type,
                            ni.mgmt_only AS neighbor_interface_mgmt_only,
                            nd.id AS neighbor_netbox_id,
                            nd.name AS neighbor
                        FROM
                            dcim_interface i
                        INNER JOIN 
                            dcim_device d
                            ON i.device_id = d.id
                        LEFT JOIN
                            dcim_interface l
                            ON l.id = i.lag_id
                        LEFT JOIN
                            dcim_interface ni
                            ON ni.id = i._connected_interface_id
                        LEFT JOIN 
                            dcim_device nd
                            ON ni.device_id = nd.id
                        WHERE
                            i.device_id={}
                        ORDER BY name;""".format(node["netbox_id"])
            
            resInts = app.common.queryDB(app.common.config["netbox"]["db"], sql)
            
            if not resInts["result"] == "success":
                return resInts
            
            nodeInterfaces = resInts["rows"]
            nodeInterfaces.sort(key=cmp_to_key(interfaceComparator))
            
            for interface in nodeInterfaces:
                interface["speed"] = getLinkSpeedOutOfFormFactor(interface["type"])
                interface["neighbor_interface_speed"] = getLinkSpeedOutOfFormFactor(interface["neighbor_interface_type"])
            
            nodeInterfacesDict = {node["id"]: nodeInterfaces}
            graphJson["results"]["interfaces"][node["id"]] = nodeInterfaces

        # form links json
        for node in graphJson["results"]["interfaces"]:
            for interface in graphJson["results"]["interfaces"][node]:
                addProdLink = False
                addMngLink = False
                
                # if connected device is on map, this link is needed to be displayed
                for i, value in enumerate(graphJson["results"]["nodes"]):
                    if (interface["neighbor_netbox_id"] == graphJson["results"]["nodes"][i]["netbox_id"]):
                        if interface["mgmt_only"] or interface["neighbor_interface_mgmt_only"]:
                            addMngLink = True
                        else:
                            addProdLink = True
                
                if (addProdLink):
                    # collapse several links between the same devices to one link with property "quantity" set to the number of links and displaying the highest bandwidth
                    for link in graphJson["results"]["links"]:
                        if ((link["source"] == interface["device"] and link["target"] == interface["neighbor"]) or 
                            (link["target"] == interface["device"] and link["source"] == interface["neighbor"])):
                            addProdLink = False
                            link["quantity"] += 1
                            
                            # if we have several links between two devices draw the fattest link
                            # TODO: draw several links of different speed in the case we have really different speeds between two boxes
                            sp = getLinkSpeedOutOfTwoInterfacesSpeed(interface["speed"], interface["neighbor_interface_speed"])
                            if (sp > link["bandwidth"]):
                                link["bandwidth"] = sp

                if (addProdLink):
                    sp = getLinkSpeedOutOfTwoInterfacesSpeed(interface["speed"], interface["neighbor_interface_speed"])
                    graphJson["results"]["links"].append({
                        "source": interface["device"],
                        "target": interface["neighbor"],
                        "bandwidth": sp,
                        "quantity": 1
                    })
                        
        
                if (addMngLink):
                    # collapse several links between the same devices to one link with property "quantity" set to the number of links and displaying the highest bandwidth
                    for link in graphJson["results"]["mng_links"]:
                        if ((link["source"] == interface["device"] and link["target"] == interface["neighbor"]) or 
                            (link["target"] == interface["device"] and link["source"] == interface["neighbor"])):
                            addMngLink = False
                            link["quantity"] += 1
                            
                            # if we have several links between two devices draw the fattest link
                            # TODO: draw several links of different speed in the case we have really different speeds between two boxes
                            sp = getLinkSpeedOutOfTwoInterfacesSpeed(interface["speed"], interface["neighbor_interface_speed"])
                            if (sp > link["bandwidth"]):
                                link["bandwidth"] = sp

                if (addMngLink):
                    sp = getLinkSpeedOutOfTwoInterfacesSpeed(interface["speed"], interface["neighbor_interface_speed"])
                    graphJson["results"]["mng_links"].append({
                        "source": interface["device"],
                        "target": interface["neighbor"],
                        "bandwidth": sp,
                        "quantity": 1
                    })

    for node in graphJson["results"]["nodes"]:
        if not node["cluster"]:
            node.pop("cluster", None)
        if not node["virtual_chassis"]:
            node.pop("virtual_chassis", None)
        if not node["virtual_chassis_id"]:
            node.pop("virtual_chassis_id")

    for node in graphJson["results"]["interfaces"]:
        for interface in graphJson["results"]["interfaces"][node]:
            if not interface["lag"]:
                interface.pop("lag", None)
                interface.pop("lag_netbox_id", None)

            if not interface["neighbor"]:
                interface.pop("neighbor", None)
                interface.pop("neighbor_interface", None)
                interface.pop("neighbor_interface_netbox_id", None)
                interface.pop("neighbor_netbox_id", None)

    for i, value in enumerate(graphJson["results"]["links"]):
        if graphJson["results"]["links"][i]["quantity"] > 1:
            graphJson["results"]["links"][i]["quantity"] = int(graphJson["results"]["links"][i]["quantity"] / 2)

    for i, value in enumerate(graphJson["results"]["mng_links"]):
        if graphJson["results"]["mng_links"][i]["quantity"] > 1:
            graphJson["results"]["mng_links"][i]["quantity"] = int(graphJson["results"]["mng_links"][i]["quantity"] / 2)

    graphJson["result"] = "success"
    
    return graphJson
