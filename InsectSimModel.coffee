exports = @

###
属性
###
exports.ATTR = { POWER:"P", STAMINA:"ST", SPEED:"SP", FIRE:"F", WATER:"W", THUNDER:"T", ICE:"I", DRAGON:"D" }

###
レベルごとの境界
###
exports.LEVEL_LIMIT_LIST = [15, 30, 45, 54, 63, 72, 81, 90]


###
イベントを呼ぶことが出来るオブジェクト
###
class ListenedItem
	constructor:()->
		@listeners = []
		@type = ""
	addListener:(listener)->
		@listeners.push(listener)
		@notifyInitialize(@)
	notifyUpdate:()->
		for listener in @listeners
			listener.onUpdate(@)
	notifyInitialize:()->
		for listener in @listeners
			listener.onInitialize(@)

###
呼ばれたイベントを処理するオブジェクト
###
class Listener
	onUpdate:(sender)-> return
	onInitialize:(sender)-> return

###
属性ステータス行
###
class exports.AttributeStatus extends ListenedItem
	# interface AbleObject
	constructor:(@name, @attribute, @initStatus, @requirePointMax, @growthUnit)->
		super()
		@type = "Status"
		@name = @name
		@status = @initStatus
		@growthPoint = 0
		@minGrowthPoint = 0
		@requirePoint = @requirePointMax
	add:(point)->
		point = Number(point)
		@growthPoint += point
		if @growthPoint < @minGrowthPoint
			oldGrowthPoint = @growthPoint - point
			@growthPoint = @minGrowthPoint
			point = @growthPoint - oldGrowthPoint

		@requirePoint -= point
		if @requirePoint <= 0
			while @requirePoint <= 0
				@requirePoint = @requirePoint + @requirePointMax
				@status += @growthUnit
		if @requirePoint > @requirePointMax
			@requirePoint = @requirePoint - @requirePointMax
			@status -= @growthUnit

		@notifyUpdate()
		
	setMinGrowthPoint:(point)->
		@minGrowthPoint = point
	getMement:->
		return [@status, @growthPoint, @minGrowthPoint, @requirePoint]
	setMement:(mement)->
		[@status, @growthPoint, @minGrowthPoint, @requirePoint] = mement
		@notifyUpdate()

###
属性ステータス行　表示用オブジェクト
###
class exports.AttributeStatusViewer extends Listener
	constructor:(elementId)->
		super()
		@jName         = $("##{elementId} td:eq(0)");
		@jStatus       = $("##{elementId} td:eq(1)");
		@jGrowthPoint  = $("##{elementId} td:eq(2)");
		@jRequirePoint = $("##{elementId} td:eq(3)");
	
	onInitialize:(attr)->
		@onUpdate(attr)

	onUpdate:(attr)->
		@jName        .text attr.name
		@jStatus      .text attr.status
		@jGrowthPoint .text attr.growthPoint
		@jRequirePoint.text attr.requirePoint

###
全成長ポイントとレベル
###
class exports.AllGrowthPoint extends ListenedItem
	# interface UndoAbleObject
	# interface Listener
	constructor:(@levelLimitList)->
		super()
		@type = "Point"
		@level = 1
		@growthPoints={}
	getAllPoint:->
		allPoint = 0
		for key,statusPoint of @growthPoints
			allPoint += statusPoint
		return allPoint
	levelUp:->
		@level += 1
		@notifyUpdate()
	isLevelUpAble:->
		if @getLevelOfSpace() != 0
			return false
		if @level >= @levelLimitList.length
			return false
		return true
	getLevelOfSpace:->
		limit = @levelLimitList[@level - 1]
		return limit - @getAllPoint()
	getMement:->
		return [@growthPoints, @level]
	setMement:(mement)->
		[@growthPoints, @level] = mement
		@notifyUpdate()
	onInitialize:(sender)->
		@onUpdate(sender)
	onUpdate:(attributeStatus)->
		@growthPoints[attributeStatus.attribute] = attributeStatus.growthPoint
		@notifyUpdate()

###
全成長ポイントとレベル　表示用オブジェクト
###
class exports.AllGrowthPointViewer extends Listener
	constructor:(@elementId)->
		super()
		
	onInitialize:(allPoint)->
		jCells = $("##{@elementId} tr:eq(1) td");
		for cell, index in jCells
			if index < allPoint.levelLimitList.length
				$(cell).text allPoint.levelLimitList[index]
			else
				$(cell).text "-"
		
		@onUpdate(allPoint)
	
	onUpdate:(allPoint)->
		jCells = $("##{@elementId} tr:eq(2) td");
		for cell, index in jCells
			if index < allPoint.level - 1
				$(cell).text allPoint.levelLimitList[index]
			else if index == allPoint.level - 1
				$(cell).text allPoint.getAllPoint()
			else if index > allPoint.level - 1
				$(cell).text "-"

###
餌履歴オブジェクト
###
class exports.FoodHistory extends ListenedItem
	# interface UndoAbleObject
	constructor:->
		super()
		@history = []
	push:(historyItem)->
		@history.push historyItem
		@notifyUpdate()
	pop:->
		@history.pop
		@notifyUpdate()
	isUndoAble:->
		if @history.length == 0 then return false
		return true
	isUndoButtonAble:->
		if @history.length == 0 then return false
		if @history[@history.length - 1] instanceof InitHistoryItem then return false
		return true
	getMement:->
		currentHistory = []
		currentHistory.push item for item in @history
		return [currentHistory]
	setMement:(mement)->
		[@history] = mement
		@notifyUpdate()

###
餌履歴アイテム
###
class HistoryItem
	constructor:->

###
餌履歴アイテム工場
###
class HistoryItemFactory
	createFromSerial:(serial, readPos)->
		readPosChar = serial[readPos]
		HistoryItemTypes = [FoodHistoryItem, InitHistoryItem, LevelUpHistoryItem]
		for historyItemType in HistoryItemTypes
			if historyItemType.isThisType(readPosChar)
				return historyItemType.createFromSerial(serial, readPos)
		throw "unexpected serial"

###
餌履歴アイテム（餌）
###
class FoodHistoryItem extends HistoryItem
	@_serialBaseChars = "-abcdefghijklmnopqrstuvwxyz"
	constructor:(@food)->
		super()
		@name = food.name
	toSerial:->
		return FoodHistoryItem._serialBaseChars[@food.id]
	@isThisType:(char)->
		return @_serialBaseChars.indexOf(char) >= 0
	@createFromSerial:(serial, readPos)->
		id = @_serialBaseChars.indexOf(serial[readPos])
		factory = new FoodFactory()
		return [new FoodHistoryItem(factory.createById(id)), 1]

###
餌履歴アイテム（レベルアップ）
###
class LevelUpHistoryItem extends HistoryItem
	@_serialBaseChars = "-ABCDEFGHIJKLMNOPQRSTUVWXYZ"
	constructor:(@level, @insectType)->
		super()
		@name = "--- Lv#{level}:#{insectType.shortName} ---"
	toSerial:->
		return LevelUpHistoryItem._serialBaseChars[@insectType.id]
	@isThisType:(char)->
		return @_serialBaseChars.indexOf(char) >= 0
	@createFromSerial:(serial, readPos)->
		id = @_serialBaseChars.indexOf(serial[readPos])
		factory = new InsectTypeFactory()
		return [new LevelUpHistoryItem(0, factory.createById(id)), 1]

###
餌履歴アイテム（現在値入力）
###
class InitHistoryItem extends HistoryItem
	@_insectBaseChars = "-ABCDEFGHIJKLMNOPQRSTUVWXYZ"
	constructor:(@level, @insectType, @growthPoints)->
		super()
		@name = "【値入力 Lv#{level}:#{insectType.shortName}】"
	toSerial:->
		serial = "("
		serial += InitHistoryItem._insectBaseChars[@insectType.id]
		for k,type of ATTR
			attribute = @growthPoints.filter( (attribute)-> attribute.type == type )[0]
			if attribute?
				serial += ("0" + String(attribute.point)).slice(-2) # 0埋め
			else
				serial += "00"
		serial += ")"
		return serial
	@isThisType:(char)->
		return char == "("
	@createFromSerial:(serial, readPos)->
		currectPos = readPos
		currectPos += 1

		id = @_insectBaseChars.indexOf(serial[currectPos])
		currectPos += 1
		factory = new InsectTypeFactory()
		insectType = factory.createById(id)
		
		growthPoints = []
		for k,type of ATTR
			point = Number(serial[currectPos] + serial[currectPos+1])
			currectPos += 2
			if point > 0
				growthPoints.push new Attribute(type, point)
		
		currectPos += 1
		readCharCount = currectPos - readPos

		return [new InitHistoryItem(0, insectType, growthPoints), readCharCount]

###
文字列変換オブジェクト
###
class HistorySerializer
	getSerial:(history) ->
		serial = ""
		for historyItem in history
			serial += historyItem.toSerial()
		
		compresser = new StrCompresser
		return compresser.compression(serial)

	readFromSerial: (serial)->
		compresser = new StrCompresser
		serial = compresser.unCompression(serial)

		historyItemFactory = new HistoryItemFactory()
		historyItems = []
		
		readPos = 0
		while readPos < serial.length
			[historyItem, readChars] = historyItemFactory.createFromSerial(serial, readPos)
			historyItems.push historyItem
			readPos += readChars

		return historyItems

###
文字列圧縮
###
class StrCompresser
	compression:(str)->
		if not str? || str == "" then return ""
	
		out = ""

		sameCount = 0
		oldChar = str[0]
		for char in str
			if char != oldChar
				out += @_compressionChars(oldChar, sameCount)
				sameCount = 0
			sameCount += 1
			oldChar = char
		out += @_compressionChars(oldChar, sameCount)
		
		return out
	
	_compressionChars:(char, sameCount)->
		if sameCount == 1 then return char
		if sameCount == 2 then return char + char
		return char + "*" + String("0" + sameCount.toString(16)).slice(-2)

	unCompression:(str)->
		out = ""
		
		strPos = 0
		while strPos < str.length
			if str[strPos] == "*"
				char = str[strPos-1]
				num = parseInt(str[strPos+1] + str[strPos+2], 16)
				out += char for i in [0...num-1]
				strPos += 3
			else
				out += str[strPos]
				strPos += 1
		
		return out

###
餌履歴オブジェクト　表示用オブジェクト
###
class exports.FoodHistoryViewer extends Listener
	constructor:(@elementId)->
		super()
	onInitialize:(foodHistory)->
		$("##{@elementId} > option").remove()
		
	onUpdate:(foodHistory)->
		jList = $("##{@elementId}")
		$("option", jList).remove()

		severalTimesList = new SeveralTimesList()
		for historyItem in foodHistory.history
			severalTimesList.push historyItem.name
		
		for item in severalTimesList.list
			jList.append $("<option>").html(item)

###
重複をまとめて表示するためのリスト
###
class SeveralTimesList
	constructor:->
		@list = []
	push:(item)->
		if @list.length == 0
			@list.push item
			return
		
		lastItem = @list[@list.length - 1]
		
		lastItemName = lastItem.match(new RegExp("^[^ ]+"))[0]
		if lastItemName != item
			@list.push item
			return
		
		times = 0
		if lastItem.match(/\ ×\ ([0-9]+)$/)
			times = Number(RegExp.$1) + 1
		else
			times = 2
		
		@list[@list.length - 1] = "#{item} × #{times}"

###
シミュレーション結果URL　表示オブジェクト
###
class HistoryUrlViewer extends Listener
	constructor:(elementId) ->
		@jText = $("##{elementId}")
		@jText.focus -> $(@).select()
	onInitialize:(sender)->
		@onUpdate(sender)
	onUpdate:(foodHistory)->
		urlBase = location.protocol + "//" + location.hostname + location.pathname
		
		serializer = new HistorySerializer()
		serial = serializer.getSerial(foodHistory.history)
		
		@jText.val "#{urlBase}?#{serial}"

###
Undoの有効無効設定　表示用オブジェクト
###
class exports.UndoEnableViewer extends Listener
	constructor:(@elementId)->
		super()
	onInitialize:(history)->
		@onUpdate(history)
	onUpdate:(history)->
		jButton = $("##{@elementId}");
		if history.isUndoButtonAble()
			jButton.removeAttr "disabled"
		else
			jButton.attr "disabled", true

###
リセットの有効無効設定　表示用オブジェクト
###
class exports.ResetEnableViewer extends Listener
	constructor:(@elementId)->
		super()
	onInitialize:(history)->
		@onUpdate(history)
	onUpdate:(history)->
		jButton = $("##{@elementId}");
		if history.isUndoAble()
			jButton.removeAttr "disabled"
		else
			jButton.attr "disabled", true

###
Undo管理オブジェクト
###
class UndoMemory
	constructor:(@undoAbleObjects)->
		@memory = []
	getMemory:->
		eachObjectMemory = []
		for object in @undoAbleObjects
			eachObjectMemory.push object.getMement()
		return eachObjectMemory
	setUndoPoint:(memory)->
		@memory.push memory
	undo:->
		if @memory.length == 0 then return
		eachObjectMemory = @memory.pop()
		for mement, i in eachObjectMemory
			@undoAbleObjects[i].setMement mement
	undoAll:->
		while @memory.length > 0
			@undo()

###
Undoオブジェクトのインターフェース
###
class UndoAbleObject
	getMement:->
	setMement:(mement)->

###
虫オブジェクト
###
class exports.Insect
	constructor:(@attributeStatusList, @allGrowthPoint, @foodHistory, @insectTypeHolder)->
		undoTargetList = [@allGrowthPoint, @foodHistory, @insectTypeHolder]
		undoTargetList.push attributeStatus for key, attributeStatus of @attributeStatusList
		@undoMemory = new UndoMemory(undoTargetList)
	eat:(food)->
		memory = @undoMemory.getMemory()

		foodEated = false
		for attribute in food.eatSotedAttributes()
			addPoint = Math.min(@allGrowthPoint.getLevelOfSpace(), attribute.point)
			@attributeStatusList[attribute.type].add addPoint
			if addPoint > 0 then foodEated = true
		
		if foodEated
			@foodHistory.push new FoodHistoryItem(food)
			@undoMemory.setUndoPoint(memory)

	levelUp:(insectType)->
		@undoMemory.setUndoPoint(@undoMemory.getMemory())
		
		@attributeStatusList[ATTR.POWER  ].setMinGrowthPoint insectType.minPowerGrowthPoint
		@attributeStatusList[ATTR.STAMINA].setMinGrowthPoint insectType.minStaminaGrowthPoint
		@attributeStatusList[ATTR.SPEED  ].setMinGrowthPoint insectType.minSpeedGrowthPoint
		
		@insectTypeHolder.levelUp(insectType)
		@allGrowthPoint.levelUp()
		@foodHistory.push new LevelUpHistoryItem(@allGrowthPoint.level, insectType)
	undo:->
		@undoMemory.undo()
	reset:->
		@undoMemory.undoAll()
	inputInit:(insectType, growthPointList)->
		@reset()
		
		@undoMemory.setUndoPoint(@undoMemory.getMemory())
		
		allPoint = 0
		for attribute in growthPointList
			@attributeStatusList[attribute.type].add attribute.point
			allPoint += Number(attribute.point)

		@attributeStatusList[ATTR.POWER  ].setMinGrowthPoint insectType.minPowerGrowthPoint
		@attributeStatusList[ATTR.STAMINA].setMinGrowthPoint insectType.minStaminaGrowthPoint
		@attributeStatusList[ATTR.SPEED  ].setMinGrowthPoint insectType.minSpeedGrowthPoint

		for i in [1...@_getLevelByPoint(allPoint)]
			@insectTypeHolder.levelUp(insectType)
			@allGrowthPoint.levelUp()
	
		@foodHistory.push new InitHistoryItem(@allGrowthPoint.level, insectType, growthPointList)

	_getLevelByPoint:(growthPoint)->
		level = 1
		for levelLimit, i in LEVEL_LIMIT_LIST
			if growthPoint >= levelLimit then level = i + 2
		
		maxLevel = LEVEL_LIMIT_LIST.length
		if level > maxLevel then level = maxLevel

		return level

	getHistory:->
		serializer = new HistorySerializer()
		return serializer.getSerial(@foodHistory.history)

	setHistory:(serial)->
		serializer = new HistorySerializer()
		historyItems = serializer.readFromSerial(serial)
		
		@reset()
		for historyItem in historyItems
			if historyItem instanceof FoodHistoryItem    then @eat(historyItem.food)
			if historyItem instanceof LevelUpHistoryItem then @levelUp(historyItem.insectType)
			if historyItem instanceof InitHistoryItem    then @inputInit(historyItem.insectType, historyItem.growthPoints)

###
属性とポイントのペア
###
class exports.Attribute
	constructor:(@type, @point)->

###
虫餌オブジェクト
###
class exports.Food
	constructor:(@id, @name, @attributes)->
		allPoint = 0
		for attribute in attributes
			allPoint += attribute.point
		
		if allPoint != 0 then throw "UnlikelyFood"
	eatSotedAttributes:->
		return @attributes.sort (attribute1, attribute2) =>
			return @sortOrder(attribute2) - @sortOrder(attribute1)
	sortOrder:(attribute)->
		order = 0
		# マイナスが優先、
		if attribute.point < 0 then order += 100
		# ポイントの多いほうが優先
		order += Math.abs(attribute.point * 10)
		# パワースタミナスピードが優先
		if attribute.type in [ATTR.POWER, ATTR.STAMINA, ATTR.SPEED]
			order += 1
		return order

###
虫餌オブジェクト工場
###
class exports.FoodFactory
	constructor:->
		@_foods = []
		@_foods.push new Food( 1, "力の虫餌・火"  , [new Attribute(ATTR.POWER  , +1), new Attribute(ATTR.FIRE    , +1), new Attribute(ATTR.WATER  , -2)])
		@_foods.push new Food( 2, "力の虫餌・火炎", [new Attribute(ATTR.POWER  , +1), new Attribute(ATTR.FIRE    , +2), new Attribute(ATTR.WATER  , -3)])
		@_foods.push new Food( 3, "力の上虫餌"    , [new Attribute(ATTR.POWER  , +2), new Attribute(ATTR.SPEED   , -1), new Attribute(ATTR.FIRE   , -1)])
		@_foods.push new Food( 4, "力の上虫餌・火", [new Attribute(ATTR.POWER  , +2), new Attribute(ATTR.FIRE    , +1), new Attribute(ATTR.SPEED  , -3)])
		@_foods.push new Food( 5, "体の虫餌・龍"  , [new Attribute(ATTR.STAMINA, +1), new Attribute(ATTR.DRAGON  , +1), new Attribute(ATTR.FIRE   , -2)])
		@_foods.push new Food( 6, "体の虫餌・破龍", [new Attribute(ATTR.STAMINA, +1), new Attribute(ATTR.DRAGON  , +2), new Attribute(ATTR.FIRE   , -3)])
		@_foods.push new Food( 7, "体の虫餌・水"  , [new Attribute(ATTR.STAMINA, +1), new Attribute(ATTR.WATER   , +1), new Attribute(ATTR.THUNDER, -2)])
		@_foods.push new Food( 8, "体の上虫餌"    , [new Attribute(ATTR.STAMINA, +2), new Attribute(ATTR.POWER   , -1), new Attribute(ATTR.WATER  , -1)])
		@_foods.push new Food( 9, "体の上虫餌・水", [new Attribute(ATTR.STAMINA, +2), new Attribute(ATTR.WATER   , +1), new Attribute(ATTR.POWER  , -3)])
		@_foods.push new Food(10, "速の虫餌・流水", [new Attribute(ATTR.SPEED  , +1), new Attribute(ATTR.WATER   , +2), new Attribute(ATTR.THUNDER, -3)])
		@_foods.push new Food(11, "速の虫餌・雷"  , [new Attribute(ATTR.SPEED  , +1), new Attribute(ATTR.THUNDER , +1), new Attribute(ATTR.ICE    , -2)])
		@_foods.push new Food(12, "速の虫餌・雷光", [new Attribute(ATTR.SPEED  , +1), new Attribute(ATTR.THUNDER , +2), new Attribute(ATTR.ICE    , -3)])
		@_foods.push new Food(13, "速の虫餌・氷"  , [new Attribute(ATTR.SPEED  , +1), new Attribute(ATTR.ICE     , +1), new Attribute(ATTR.DRAGON , -2)])
		@_foods.push new Food(14, "速の虫餌・氷結", [new Attribute(ATTR.SPEED  , +1), new Attribute(ATTR.ICE     , +2), new Attribute(ATTR.DRAGON , -3)])
		@_foods.push new Food(15, "速の上虫餌"    , [new Attribute(ATTR.SPEED  , +2), new Attribute(ATTR.STAMINA , -1), new Attribute(ATTR.THUNDER, -1)])
		@_foods.push new Food(16, "速の上虫餌・雷", [new Attribute(ATTR.SPEED  , +2), new Attribute(ATTR.THUNDER , +1), new Attribute(ATTR.STAMINA, -3)])
		@_foods.push new Food(17, "虫餌・火炎"    , [new Attribute(ATTR.FIRE   , +2), new Attribute(ATTR.WATER   , -1), new Attribute(ATTR.ICE    , -1)])
		@_foods.push new Food(18, "虫餌・流水"    , [new Attribute(ATTR.WATER  , +2), new Attribute(ATTR.THUNDER , -1), new Attribute(ATTR.DRAGON , -1)])
		@_foods.push new Food(19, "虫餌・雷光"    , [new Attribute(ATTR.THUNDER, +2), new Attribute(ATTR.SPEED   , -1), new Attribute(ATTR.ICE    , -1)])
		@_foods.push new Food(20, "虫餌・氷結"    , [new Attribute(ATTR.ICE    , +2), new Attribute(ATTR.STAMINA , -1), new Attribute(ATTR.DRAGON , -1)])
		@_foods.push new Food(21, "虫餌・破龍"    , [new Attribute(ATTR.DRAGON , +2), new Attribute(ATTR.POWER   , -1), new Attribute(ATTR.FIRE   , -1)])

	create:(name)->
		for food in @_foods
			if food.name == name then return food
		
	createById:(id)->
		for food in @_foods
			if food.id == id then return food

###
虫種類の保持
###
class exports.InsectTypeHolder extends ListenedItem
	# interface UndoAbleObject
	constructor:(@insectType)->
		super()
		@type="InsectHolder"
		@level = 1
	levelUp:(insectType)->
		@insectType = insectType
		@level += 1
		@notifyUpdate()
	getNextInsectType:->
		nextInsectType = []
		for childInsectType in @insectType.getChild()
			if childInsectType.level == @level + 1
				nextInsectType.push childInsectType
		
		if nextInsectType.length == 0
			nextInsectType.push @insectType
		
		return nextInsectType
	getMement:->
		return [@insectType, @level]
	setMement:(mement)->
		[@insectType, @level] = mement
		@notifyUpdate()

###
虫種類オブジェクト
###
class InsectType
	constructor:(@id, @name, @shortName, @level, @minPower, @minStamina, @minSpeed, @skill)->
		@childType = []
		
		@minPowerGrowthPoint   = @minPower - 60
		@minStaminaGrowthPoint = @minStamina - 60
		@minSpeedGrowthPoint   = @minSpeed - 60
		
	addChild:(childType)->
		@childType.push childType

	getChild:->
		return @childType

	getChildByName:(searchName)->
		if searchName == @shortName then return @
		for child in @getChild()
			searchResult = child.getChildByName(searchName)
			if searchResult? then return searchResult
		return null

	getChildById:(id)->
		if id == @id then return @
		for child in @getChild()
			searchResult = child.getChildById(id)
			if searchResult? then return searchResult
		return null

	getAbleChilds:(targetLevel, targetGrowthPointList)->
		ableChilds = []
		
		if @_checkAbleInsect(targetLevel, targetGrowthPointList)
			ableChilds.push @
		
		for child in @getChild()
			ableChilds = ableChilds.concat(child.getAbleChilds(targetLevel, targetGrowthPointList))

		return ableChilds

	_checkAbleInsect:(targetLevel, targetGrowthPointList)->
		if @childType.length > 0
			nextEvoluteLevel = @childType[0].level
		else
			nextEvoluteLevel = 99

		if not (@level <= targetLevel < nextEvoluteLevel)               then return false
		if targetGrowthPointList[ATTR.POWER  ] < @minPowerGrowthPoint   then return false
		if targetGrowthPointList[ATTR.STAMINA] < @minStaminaGrowthPoint then return false
		if targetGrowthPointList[ATTR.SPEED  ] < @minSpeedGrowthPoint   then return false

		return true

###
Null虫種類オブジェクト
###
class exports.NullInsectType extends InsectType
	constructor:->
		super(0, "", "", 1, 999, 999, 999, "");

###
レベルアップボタン一覧
###
class exports.LevelUpButtonsTypeChanger extends Listener
	constructor:(@buttons)->
		super()
	onInitialize:(sender)->
		@onUpdate(sender)
	onUpdate:(insectTypeHolder)->
		nextInsectTypes = insectTypeHolder.getNextInsectType()
		
		for button, i in @buttons
			insectType = nextInsectTypes[i]
			if i < nextInsectTypes.length
				button.set "レベルアップ#{insectType.shortName}", insectType
			else
				button.set "-", new NullInsectType()

###
レベルアップボタン
###
class exports.LevelUpButton extends ListenedItem
	# interface Listener
	constructor:(@name, @nextInsectType)->
		super()
		@statusPoints ={}
		@statusPoints[ATTR.POWER  ] = 0
		@statusPoints[ATTR.STAMINA] = 0
		@statusPoints[ATTR.SPEED  ] = 0
		@isLevelUpAble = false
		
	set:(@name, @nextInsectType)->
		@notifyUpdate()
	
	isEnabled:->
		if @statusPoints[ATTR.POWER  ] < @nextInsectType.minPower   then return false
		if @statusPoints[ATTR.STAMINA] < @nextInsectType.minStamina then return false
		if @statusPoints[ATTR.SPEED  ] < @nextInsectType.minSpeed   then return false
		if @isLevelUpAble == false                                  then return false
		return true
	
	onInitialize:(sender)->
		@onUpdate(sender)
		
	onUpdate:(sender)->
		if sender.type == "Point"  then @onUpdateByPoint(sender)
		if sender.type == "Status" then @onUpdateByAttributeStatus(sender)
		@notifyUpdate()
	
	onUpdateByPoint:(allPoint)->
		@isLevelUpAble = allPoint.isLevelUpAble()

	onUpdateByAttributeStatus:(attributeStatus)->
		@statusPoints[attributeStatus.attribute] = attributeStatus.status

###
レベルアップボタン　表示オブジェクト
###
class exports.LevelUpButtonViewer extends Listener
	constructor:(@elementId)->
		super()
	onInitialize:(levelUpButton)->
		@onUpdate(levelUpButton)
	onUpdate:(levelUpButton)->
		jButton = $("##{@elementId}");
		
		jButton.val levelUpButton.name
		jButton.data "nextInsectType", levelUpButton.nextInsectType
		
		if levelUpButton.isEnabled()
			jButton.removeAttr "disabled"
		else
			jButton.attr "disabled", true

###
進化アイテム
###
class exports.InsectEvolutionItem extends ListenedItem
	# interface Listener
	constructor:(@condInsectType)->
		super()
		@statusPoints ={}
		@statusPoints[ATTR.POWER  ] = 0
		@statusPoints[ATTR.STAMINA] = 0
		@statusPoints[ATTR.SPEED  ] = 0
		@currentInsectType = new NullInsectType()
		
	CheckEvolution:->
		if @statusPoints[ATTR.POWER  ] < @condInsectType.minPower   then return false
		if @statusPoints[ATTR.STAMINA] < @condInsectType.minStamina then return false
		if @statusPoints[ATTR.SPEED  ] < @condInsectType.minSpeed   then return false
		return true
	
	CheckCurrent:->
		return @currentInsectType.shortName == @condInsectType.shortName

	onInitialize:(sender)->
		@onUpdate(sender)
		
	onUpdate:(sender)->
		if sender.type == "InsectHolder" then @onUpdateByInsectHolder(sender)
		if sender.type == "Status"       then @onUpdateByAttributeStatus(sender)
		@notifyUpdate()
	
	onUpdateByInsectHolder:(insectTypeHolder)->
		@currentInsectType = insectTypeHolder.insectType

	onUpdateByAttributeStatus:(attributeStatus)->
		@statusPoints[attributeStatus.attribute] = attributeStatus.status

###
進化アイテム　表示オブジェクト
###
class exports.InsectEvolutionItemViewer extends Listener
	constructor:(@elementId)->
		super()
	onInitialize:(insectEvolutionItem)->
		@onUpdate(insectEvolutionItem)
	onUpdate:(insectEvolutionItem)->
		jEvolutionItem = $("##{@elementId}");
		
		jEvolutionItem.css "color", (if insectEvolutionItem.CheckEvolution() then "black" else "silver")
		jEvolutionItem.css "font-weight", (if insectEvolutionItem.CheckCurrent() then "bold" else "normal")

###
虫種類オブジェクト建築指揮者
###
class exports.InsectTypeFactory
	constructor:->
		@root = new InsectType( 1, "マルドローン/クルドローン"                , "(初期)", 1, 60, 60, 60, "無し")
		c1    = new InsectType( 2, "ザミールビートル/アルマスタッグ"          , "(攻)"  , 4, 78, 60, 60, "攻撃UP【小】")
		c1_1  = new InsectType( 3, "ケーニヒゴアビートル/モナークブルスタッグ", "(攻＋)", 7, 96, 60, 60, "攻撃UP【大】")
		c1_2  = new InsectType( 4, "フィルカーノ/レジナヴァランテ"            , "(攻回)", 7, 87, 66, 63, "攻撃UP【中】 / 回復UP【小】")
		c2    = new InsectType( 5, "ハルキータ/ガシルドーレ"                  , "(体)"  , 4, 60, 78, 60, "スタミナUP【小】")
		c2_1  = new InsectType( 6, "ドルンキータ/ドゥンクラーブ"              , "(体＋)", 7, 60, 96, 60, "スタミナUP【大】")
		c2_2  = new InsectType( 7, "アルジョアーニャ/ウカドゥーレ"            , "(体回)", 7, 69, 84, 63, "スタミナUP【中】 / 回復UP【小】")
		c3    = new InsectType( 8, "ガルーヘル/カゼキリバネ"                  , "(速)"  , 4, 60, 60, 78, "スピードUP【小】")
		c3_1  = new InsectType( 9, "メイヴァーチル/オオシナト"                , "(速＋)", 7, 60, 60, 96, "スピードUP【大】")
		c3_2  = new InsectType(10, "ヴァンリエール/シナトモドキ"              , "(速回)", 7, 69, 66, 81, "スピードUP【中】 / 回復UP【小】")
		c4    = new InsectType(11, "エボマルドローン/エボクルドローン"        , "(汎)"  , 4, 69, 66, 63, "全ステータスUP【小】")
		c4_1  = new InsectType(12, "アルジャーロン/エルドラーン"              , "(汎＋)", 7, 78, 72, 66, "全ステータスUP【中】 / 回復UP【大】")
		
		@root.addChild c1
		c1   .addChild c1_1
		c1   .addChild c1_2
		@root.addChild c2
		c2   .addChild c2_1
		c2   .addChild c2_2
		@root.addChild c3
		c3   .addChild c3_1
		c3   .addChild c3_2
		@root.addChild c4
		c4   .addChild c4_1

	createRoot:->
		return @root

	createById:(id)->
		return @root.getChildById(id)

###
虫オブジェクト建造者
###
class exports.InsectBuilder
	constructor:->
		@attributeStatusList = null
		@allGrowthPoint = null
		@foodHistory = null
		@insectTypeHolder = null

		insectTypeFactory = new InsectTypeFactory()
		@rootInsectType = insectTypeFactory.createRoot()

	initAttributeStatusList:->
		@attributeStatusList = {}

		@attributeStatusList[ATTR.POWER  ] = new AttributeStatus("パワー"  , ATTR.POWER  , 60, 9, 9)
		@attributeStatusList[ATTR.STAMINA] = new AttributeStatus("スタミナ", ATTR.STAMINA, 60, 6, 6)
		@attributeStatusList[ATTR.SPEED  ] = new AttributeStatus("スピード", ATTR.SPEED  , 60, 3, 3)
		@attributeStatusList[ATTR.FIRE   ] = new AttributeStatus("火属性"  , ATTR.FIRE   , 0 , 3, 2)
		@attributeStatusList[ATTR.WATER  ] = new AttributeStatus("水属性"  , ATTR.WATER  , 0 , 3, 2)
		@attributeStatusList[ATTR.THUNDER] = new AttributeStatus("雷属性"  , ATTR.THUNDER, 0 , 6, 4)
		@attributeStatusList[ATTR.ICE    ] = new AttributeStatus("氷属性"  , ATTR.ICE    , 0 , 6, 4)
		@attributeStatusList[ATTR.DRAGON ] = new AttributeStatus("龍属性"  , ATTR.DRAGON , 0 , 9, 6)

		@attributeStatusList[ATTR.POWER  ].addListener new AttributeStatusViewer("trPower"  )
		@attributeStatusList[ATTR.STAMINA].addListener new AttributeStatusViewer("trStamina")
		@attributeStatusList[ATTR.SPEED  ].addListener new AttributeStatusViewer("trSpeed"  )
		@attributeStatusList[ATTR.FIRE   ].addListener new AttributeStatusViewer("trFire"   )
		@attributeStatusList[ATTR.WATER  ].addListener new AttributeStatusViewer("trWater"  )
		@attributeStatusList[ATTR.THUNDER].addListener new AttributeStatusViewer("trThunder")
		@attributeStatusList[ATTR.ICE    ].addListener new AttributeStatusViewer("trIce"    )
		@attributeStatusList[ATTR.DRAGON ].addListener new AttributeStatusViewer("trDragon" )
	
	initAllGrowthPoint:->
		@allGrowthPoint = new AllGrowthPoint(LEVEL_LIMIT_LIST)
		@allGrowthPoint.addListener new AllGrowthPointViewer("tblAllGrowthPoint")
		
		for key,attributeStatus of @attributeStatusList
			attributeStatus.addListener @allGrowthPoint

	initFoodHistory:->
		@foodHistory = new FoodHistory()
		@foodHistory.addListener new FoodHistoryViewer("lstFoodHistory")
		@foodHistory.addListener new UndoEnableViewer("btnUndo")
		@foodHistory.addListener new ResetEnableViewer("btnReset")
		@foodHistory.addListener new HistoryUrlViewer("txtResultUrl")

	initInsectTypeHolder:->
		@insectTypeHolder = new InsectTypeHolder(@rootInsectType)
	
	addLevelUpButtons:->
		buttons = []
		buttons.push @_buildButton("btnLevelUp0")
		buttons.push @_buildButton("btnLevelUp1")
		buttons.push @_buildButton("btnLevelUp2")
		buttons.push @_buildButton("btnLevelUp3")
		
		buttonsTypeChanger = new LevelUpButtonsTypeChanger(buttons)
		@insectTypeHolder.addListener buttonsTypeChanger
		
	_buildButton: (elementId)->
		button = new LevelUpButton("-", new NullInsectType())
		button.addListener new LevelUpButtonViewer(elementId)
		
		@allGrowthPoint.addListener button
		@attributeStatusList[ATTR.POWER  ].addListener button
		@attributeStatusList[ATTR.STAMINA].addListener button
		@attributeStatusList[ATTR.SPEED  ].addListener button
		
		return button

	addEvolutionItems:->
		@_buildEvolutionItem("lblEvo0")
		@_buildEvolutionItem("lblEvo1")
		@_buildEvolutionItem("lblEvo2")
		@_buildEvolutionItem("lblEvo3")
		@_buildEvolutionItem("lblEvo4")
		@_buildEvolutionItem("lblEvo5")
		@_buildEvolutionItem("lblEvo6")
		@_buildEvolutionItem("lblEvo7")
		@_buildEvolutionItem("lblEvo8")
		@_buildEvolutionItem("lblEvo9")
		@_buildEvolutionItem("lblEvo10")
		@_buildEvolutionItem("lblEvo11")

	_buildEvolutionItem: (elementId)->
		name = "(" + $("##{elementId}").text() + ")"
		insectType = @rootInsectType.getChildByName(name)
	
		insectEvolutionItem = new InsectEvolutionItem(insectType)
		insectEvolutionItem.addListener new InsectEvolutionItemViewer(elementId)
		
		@insectTypeHolder.addListener insectEvolutionItem
		@attributeStatusList[ATTR.POWER  ].addListener insectEvolutionItem
		@attributeStatusList[ATTR.STAMINA].addListener insectEvolutionItem
		@attributeStatusList[ATTR.SPEED  ].addListener insectEvolutionItem
		
		return insectEvolutionItem
	
	getResult:->
		if @attributeStatusList == null then throw "not initialized attributeStatusList"
		if @allGrowthPoint      == null then throw "not initialized allGrowthPoint"
		if @foodHistory         == null then throw "not initialized foodHistory"
		if @insectTypeHolder    == null then throw "not initialized insectTypeHolder"
	
		return new Insect(
			@attributeStatusList, 
			@allGrowthPoint, 
			@foodHistory, 
			@insectTypeHolder
			)

###
虫オブジェクト建築指揮者
###
class exports.InsectBuildDirector
	constructor:(@builder)->
	construct:->
		@builder.initAttributeStatusList()
		@builder.initAllGrowthPoint()
		@builder.initFoodHistory()
		@builder.initInsectTypeHolder()
		@builder.addLevelUpButtons()
		@builder.addEvolutionItems()
		
		return @builder.getResult()

# dialog ----------------------------------------------------------------------

###
数値入力の正当性チェック
###
class exports.NumberRangeValidViewer extends ListenedItem
	constructor:(selector, @min, @max)->
		super()
		@jText = $(selector)
		@jText.change => @onChange()
		@jText.keyup  => @onChange()

	isValid:()->
		val = @jText.val()
		if val == "" || isNaN(val)           then return false
		if not (@min <= Number(val) <= @max) then return false
		return true

	onChange:->
		if @isValid()
			@jText.css "background-color", ""
		else
			@jText.css "background-color", "pink"
		@notifyUpdate()


###
全体合計の正当性チェック
###
class exports.NumberSumMaxValidViewer extends ListenedItem
	constructor:(selectores, errorProviderSelector, @max)->
		super()
		@summary = []

		@jTexts = $(selectores)
		for text,i in @jTexts
			text.uniqueNo = i
			@summary[i] = text.value
		@jTexts.change (e) => @onChange(e.target)
		@jTexts.keyup  (e) => @onChange(e.target)

		@jErrorProvider = $(errorProviderSelector)
		
		@onChange @jTexts[0]

	isValid:->
		sum = 0
		for i in @summary
			sum += Number(i)
		
		if not isNaN(sum) && @max < sum then return false
		return true

	onChange:(target)->
		@summary[target.uniqueNo] = target.value
		if @isValid()
			@jErrorProvider.text " "
		else
			@jErrorProvider.text "※合計 #{@max} 以内で入力してください。"
		@notifyUpdate()

###
正当性チェックが必要なボタン
###
class exports.RequireValidationButtonViewer extends Listener
	constructor:(@elementId, @validaters)->
		super()
		for validater in @validaters
			validater.addListener @
	onInitialize:(sender)->
		@onUpdate(sender)
	onUpdate:(sender)->
		isAllValid = true
		for validater in @validaters
			isAllValid = isAllValid && validater.isValid()
		
		jButton = $("##{@elementId}");
		if isAllValid
			jButton.removeAttr "disabled"
		else
			jButton.attr "disabled", true

###
利用可能虫種類を列挙する
###
class exports.AbleInsectTypeLister extends ListenedItem
	constructor:(@levelLimitList, @rootInsectType)->
		super()
		@growthPointList = {}
		@growthPointList[ATTR.POWER  ] = 0
		@growthPointList[ATTR.STAMINA] = 0
		@growthPointList[ATTR.SPEED  ] = 0
		@ableList=[@rootInsectType]
	setGrowthPoint:(attribute, point)->
		if not isNaN(point) || point == ""
			@growthPointList[attribute] = Number(point)
		else
			@growthPointList[attribute] = 0
		@ableList = @rootInsectType.getAbleChilds(@_getLevel(), @growthPointList)
		@notifyUpdate()
	getAbleList:->
		return @ableList
	_getLevel:->
		allPoint = 0
		for attributes, point of @growthPointList
			allPoint += point
		
		level = 1
		for levelLimit, i in @levelLimitList
			if allPoint >= levelLimit then level = i + 2
		
		return level

###
利用可能虫種類を列挙する　表示オブジェクト
###
class exports.AbleInsectTypeListerViewer extends Listener
	constructor:(elementId)->
		super()
		@jCombo = $("##{elementId}");
	onInitialize:(sender)->
		@onUpdate(sender)
	onUpdate:(ableInsectTypeLister)->
		currentInsectName = @jCombo.val()
		
		ableInsectNames = []
		@jCombo.find("option").remove();
		for insectType in ableInsectTypeLister.getAbleList()
			ableInsectNames.push insectType.shortName
			@jCombo.append("<option value='#{insectType.shortName}'>#{insectType.shortName} #{insectType.name}</option>")
			       .data("insectType", insectType)

		if currentInsectName in ableInsectNames
			@jCombo.val currentInsectName
		else
			@jCombo.prop "selectedIndex", 0

###
###
class exports.InitDialog
	constructor:(elementId)->
		@jDialog = $("##{elementId}")
	show:->
		@initValues()
		@jDialog.show()
	close:->
		@jDialog.hide()
	initValues:->
		jGrowthPointTextboxs = $("div.dialogBody div.TextArea input:text")
		jGrowthPointTextboxs.val(0).change()

###
パラメータ入力ダイアログ建造者
###
class exports.InitDialogBuilder
	constructor:->
		@validators = null

		insectTypeFactory = new InsectTypeFactory()
		@rootInsectType = insectTypeFactory.createRoot()

	initValidaters:->
		@validators = []
		$("div.dialogBody div.TextArea input:text").each (i, textbox)=>
			@validators.push new NumberRangeValidViewer("#" + textbox.id, 0, 90)
		@validators.push new NumberSumMaxValidViewer("#frmInitDialog .TextArea input:text", "#lblErrorProvider", 90)
	
	addAbleInsectTypeLister:->
		ableInsectTypeLister = new AbleInsectTypeLister(LEVEL_LIMIT_LIST, @rootInsectType)
		ableInsectTypeLister.addListener new AbleInsectTypeListerViewer("cmbInsectType")

		jGrowthPointTextboxs = $("div.dialogBody div.TextArea input:text")
		jGrowthPointTextboxs[0].attribute = ATTR.POWER
		jGrowthPointTextboxs[1].attribute = ATTR.STAMINA
		jGrowthPointTextboxs[2].attribute = ATTR.SPEED
		jGrowthPointTextboxs[3].attribute = ATTR.FIRE
		jGrowthPointTextboxs[4].attribute = ATTR.WATER
		jGrowthPointTextboxs[5].attribute = ATTR.THUNDER
		jGrowthPointTextboxs[6].attribute = ATTR.ICE
		jGrowthPointTextboxs[7].attribute = ATTR.DRAGON

		jGrowthPointTextboxs.change ->
			ableInsectTypeLister.setGrowthPoint $(@).prop("attribute"), $(@).val()
		jGrowthPointTextboxs.keyup ->
			ableInsectTypeLister.setGrowthPoint $(@).prop("attribute"), $(@).val()

		jGrowthPointTextboxs.change()

	addRequireValidationButtonViewer:->
		new RequireValidationButtonViewer("btnInitDialogOk", @validators);

	getResult:->
		return new InitDialog("initDialog")

###
パラメータ入力ダイアログ建築指揮者
###
class exports.InitDialogBuildDirector
	constructor:(@builder)->
	construct:->
		@builder.initValidaters()
		@builder.addAbleInsectTypeLister()
		@builder.addRequireValidationButtonViewer()
		
		return @builder.getResult()

