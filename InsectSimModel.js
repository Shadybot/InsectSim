(function() {
  var FoodHistoryItem, HistoryItem, HistoryItemFactory, HistorySerializer, HistoryUrlViewer, InitHistoryItem, InsectType, LevelUpHistoryItem, ListenedItem, Listener, SeveralTimesList, StrCompresser, UndoAbleObject, UndoMemory, exports,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  exports = this;

  /*
  属性
  */


  exports.ATTR = {
    POWER: "P",
    STAMINA: "ST",
    SPEED: "SP",
    FIRE: "F",
    WATER: "W",
    THUNDER: "T",
    ICE: "I",
    DRAGON: "D"
  };

  /*
  レベルごとの境界
  */


  exports.LEVEL_LIMIT_LIST = [15, 30, 45, 54, 63, 72, 81, 90];

  /*
  イベントを呼ぶことが出来るオブジェクト
  */


  ListenedItem = (function() {
    function ListenedItem() {
      this.listeners = [];
      this.type = "";
    }

    ListenedItem.prototype.addListener = function(listener) {
      this.listeners.push(listener);
      return this.notifyInitialize(this);
    };

    ListenedItem.prototype.notifyUpdate = function() {
      var listener, _i, _len, _ref, _results;
      _ref = this.listeners;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        listener = _ref[_i];
        _results.push(listener.onUpdate(this));
      }
      return _results;
    };

    ListenedItem.prototype.notifyInitialize = function() {
      var listener, _i, _len, _ref, _results;
      _ref = this.listeners;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        listener = _ref[_i];
        _results.push(listener.onInitialize(this));
      }
      return _results;
    };

    return ListenedItem;

  })();

  /*
  呼ばれたイベントを処理するオブジェクト
  */


  Listener = (function() {
    function Listener() {}

    Listener.prototype.onUpdate = function(sender) {};

    Listener.prototype.onInitialize = function(sender) {};

    return Listener;

  })();

  /*
  属性ステータス行
  */


  exports.AttributeStatus = (function(_super) {
    __extends(AttributeStatus, _super);

    function AttributeStatus(name, attribute, initStatus, requirePointMax, growthUnit) {
      this.name = name;
      this.attribute = attribute;
      this.initStatus = initStatus;
      this.requirePointMax = requirePointMax;
      this.growthUnit = growthUnit;
      AttributeStatus.__super__.constructor.call(this);
      this.type = "Status";
      this.name = this.name;
      this.status = this.initStatus;
      this.growthPoint = 0;
      this.minGrowthPoint = 0;
      this.requirePoint = this.requirePointMax;
    }

    AttributeStatus.prototype.add = function(point) {
      var oldGrowthPoint;
      point = Number(point);
      this.growthPoint += point;
      if (this.growthPoint < this.minGrowthPoint) {
        oldGrowthPoint = this.growthPoint - point;
        this.growthPoint = this.minGrowthPoint;
        point = this.growthPoint - oldGrowthPoint;
      }
      this.requirePoint -= point;
      if (this.requirePoint <= 0) {
        while (this.requirePoint <= 0) {
          this.requirePoint = this.requirePoint + this.requirePointMax;
          this.status += this.growthUnit;
        }
      }
      if (this.requirePoint > this.requirePointMax) {
        this.requirePoint = this.requirePoint - this.requirePointMax;
        this.status -= this.growthUnit;
      }
      return this.notifyUpdate();
    };

    AttributeStatus.prototype.setMinGrowthPoint = function(point) {
      return this.minGrowthPoint = point;
    };

    AttributeStatus.prototype.getMement = function() {
      return [this.status, this.growthPoint, this.minGrowthPoint, this.requirePoint];
    };

    AttributeStatus.prototype.setMement = function(mement) {
      this.status = mement[0], this.growthPoint = mement[1], this.minGrowthPoint = mement[2], this.requirePoint = mement[3];
      return this.notifyUpdate();
    };

    return AttributeStatus;

  })(ListenedItem);

  /*
  属性ステータス行　表示用オブジェクト
  */


  exports.AttributeStatusViewer = (function(_super) {
    __extends(AttributeStatusViewer, _super);

    function AttributeStatusViewer(elementId) {
      AttributeStatusViewer.__super__.constructor.call(this);
      this.jName = $("#" + elementId + " td:eq(0)");
      this.jStatus = $("#" + elementId + " td:eq(1)");
      this.jGrowthPoint = $("#" + elementId + " td:eq(2)");
      this.jRequirePoint = $("#" + elementId + " td:eq(3)");
    }

    AttributeStatusViewer.prototype.onInitialize = function(attr) {
      return this.onUpdate(attr);
    };

    AttributeStatusViewer.prototype.onUpdate = function(attr) {
      this.jName.text(attr.name);
      this.jStatus.text(attr.status);
      this.jGrowthPoint.text(attr.growthPoint);
      return this.jRequirePoint.text(attr.requirePoint);
    };

    return AttributeStatusViewer;

  })(Listener);

  /*
  全成長ポイントとレベル
  */


  exports.AllGrowthPoint = (function(_super) {
    __extends(AllGrowthPoint, _super);

    function AllGrowthPoint(levelLimitList) {
      this.levelLimitList = levelLimitList;
      AllGrowthPoint.__super__.constructor.call(this);
      this.type = "Point";
      this.level = 1;
      this.growthPoints = {};
    }

    AllGrowthPoint.prototype.getAllPoint = function() {
      var allPoint, key, statusPoint, _ref;
      allPoint = 0;
      _ref = this.growthPoints;
      for (key in _ref) {
        statusPoint = _ref[key];
        allPoint += statusPoint;
      }
      return allPoint;
    };

    AllGrowthPoint.prototype.levelUp = function() {
      this.level += 1;
      return this.notifyUpdate();
    };

    AllGrowthPoint.prototype.isLevelUpAble = function() {
      if (this.getLevelOfSpace() !== 0) {
        return false;
      }
      if (this.level >= this.levelLimitList.length) {
        return false;
      }
      return true;
    };

    AllGrowthPoint.prototype.getLevelOfSpace = function() {
      var limit;
      limit = this.levelLimitList[this.level - 1];
      return limit - this.getAllPoint();
    };

    AllGrowthPoint.prototype.getMement = function() {
      return [this.growthPoints, this.level];
    };

    AllGrowthPoint.prototype.setMement = function(mement) {
      this.growthPoints = mement[0], this.level = mement[1];
      return this.notifyUpdate();
    };

    AllGrowthPoint.prototype.onInitialize = function(sender) {
      return this.onUpdate(sender);
    };

    AllGrowthPoint.prototype.onUpdate = function(attributeStatus) {
      this.growthPoints[attributeStatus.attribute] = attributeStatus.growthPoint;
      return this.notifyUpdate();
    };

    return AllGrowthPoint;

  })(ListenedItem);

  /*
  全成長ポイントとレベル　表示用オブジェクト
  */


  exports.AllGrowthPointViewer = (function(_super) {
    __extends(AllGrowthPointViewer, _super);

    function AllGrowthPointViewer(elementId) {
      this.elementId = elementId;
      AllGrowthPointViewer.__super__.constructor.call(this);
    }

    AllGrowthPointViewer.prototype.onInitialize = function(allPoint) {
      var cell, index, jCells, _i, _len;
      jCells = $("#" + this.elementId + " tr:eq(1) td");
      for (index = _i = 0, _len = jCells.length; _i < _len; index = ++_i) {
        cell = jCells[index];
        if (index < allPoint.levelLimitList.length) {
          $(cell).text(allPoint.levelLimitList[index]);
        } else {
          $(cell).text("-");
        }
      }
      return this.onUpdate(allPoint);
    };

    AllGrowthPointViewer.prototype.onUpdate = function(allPoint) {
      var cell, index, jCells, _i, _len, _results;
      jCells = $("#" + this.elementId + " tr:eq(2) td");
      _results = [];
      for (index = _i = 0, _len = jCells.length; _i < _len; index = ++_i) {
        cell = jCells[index];
        if (index < allPoint.level - 1) {
          _results.push($(cell).text(allPoint.levelLimitList[index]));
        } else if (index === allPoint.level - 1) {
          _results.push($(cell).text(allPoint.getAllPoint()));
        } else if (index > allPoint.level - 1) {
          _results.push($(cell).text("-"));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    return AllGrowthPointViewer;

  })(Listener);

  /*
  餌履歴オブジェクト
  */


  exports.FoodHistory = (function(_super) {
    __extends(FoodHistory, _super);

    function FoodHistory() {
      FoodHistory.__super__.constructor.call(this);
      this.history = [];
    }

    FoodHistory.prototype.push = function(historyItem) {
      this.history.push(historyItem);
      return this.notifyUpdate();
    };

    FoodHistory.prototype.pop = function() {
      this.history.pop;
      return this.notifyUpdate();
    };

    FoodHistory.prototype.isUndoAble = function() {
      if (this.history.length === 0) {
        return false;
      }
      return true;
    };

    FoodHistory.prototype.isUndoButtonAble = function() {
      if (this.history.length === 0) {
        return false;
      }
      if (this.history[this.history.length - 1] instanceof InitHistoryItem) {
        return false;
      }
      return true;
    };

    FoodHistory.prototype.getMement = function() {
      var currentHistory, item, _i, _len, _ref;
      currentHistory = [];
      _ref = this.history;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        item = _ref[_i];
        currentHistory.push(item);
      }
      return [currentHistory];
    };

    FoodHistory.prototype.setMement = function(mement) {
      this.history = mement[0];
      return this.notifyUpdate();
    };

    return FoodHistory;

  })(ListenedItem);

  /*
  餌履歴アイテム
  */


  HistoryItem = (function() {
    function HistoryItem() {}

    return HistoryItem;

  })();

  /*
  餌履歴アイテム工場
  */


  HistoryItemFactory = (function() {
    function HistoryItemFactory() {}

    HistoryItemFactory.prototype.createFromSerial = function(serial, readPos) {
      var HistoryItemTypes, historyItemType, readPosChar, _i, _len;
      readPosChar = serial[readPos];
      HistoryItemTypes = [FoodHistoryItem, InitHistoryItem, LevelUpHistoryItem];
      for (_i = 0, _len = HistoryItemTypes.length; _i < _len; _i++) {
        historyItemType = HistoryItemTypes[_i];
        if (historyItemType.isThisType(readPosChar)) {
          return historyItemType.createFromSerial(serial, readPos);
        }
      }
      throw "unexpected serial";
    };

    return HistoryItemFactory;

  })();

  /*
  餌履歴アイテム（餌）
  */


  FoodHistoryItem = (function(_super) {
    __extends(FoodHistoryItem, _super);

    FoodHistoryItem._serialBaseChars = "-abcdefghijklmnopqrstuvwxyz";

    function FoodHistoryItem(food) {
      this.food = food;
      FoodHistoryItem.__super__.constructor.call(this);
      this.name = food.name;
    }

    FoodHistoryItem.prototype.toSerial = function() {
      return FoodHistoryItem._serialBaseChars[this.food.id];
    };

    FoodHistoryItem.isThisType = function(char) {
      return this._serialBaseChars.indexOf(char) >= 0;
    };

    FoodHistoryItem.createFromSerial = function(serial, readPos) {
      var factory, id;
      id = this._serialBaseChars.indexOf(serial[readPos]);
      factory = new FoodFactory();
      return [new FoodHistoryItem(factory.createById(id)), 1];
    };

    return FoodHistoryItem;

  })(HistoryItem);

  /*
  餌履歴アイテム（レベルアップ）
  */


  LevelUpHistoryItem = (function(_super) {
    __extends(LevelUpHistoryItem, _super);

    LevelUpHistoryItem._serialBaseChars = "-ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    function LevelUpHistoryItem(level, insectType) {
      this.level = level;
      this.insectType = insectType;
      LevelUpHistoryItem.__super__.constructor.call(this);
      this.name = "--- Lv" + level + ":" + insectType.shortName + " ---";
    }

    LevelUpHistoryItem.prototype.toSerial = function() {
      return LevelUpHistoryItem._serialBaseChars[this.insectType.id];
    };

    LevelUpHistoryItem.isThisType = function(char) {
      return this._serialBaseChars.indexOf(char) >= 0;
    };

    LevelUpHistoryItem.createFromSerial = function(serial, readPos) {
      var factory, id;
      id = this._serialBaseChars.indexOf(serial[readPos]);
      factory = new InsectTypeFactory();
      return [new LevelUpHistoryItem(0, factory.createById(id)), 1];
    };

    return LevelUpHistoryItem;

  })(HistoryItem);

  /*
  餌履歴アイテム（現在値入力）
  */


  InitHistoryItem = (function(_super) {
    __extends(InitHistoryItem, _super);

    InitHistoryItem._insectBaseChars = "-ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    function InitHistoryItem(level, insectType, growthPoints) {
      this.level = level;
      this.insectType = insectType;
      this.growthPoints = growthPoints;
      InitHistoryItem.__super__.constructor.call(this);
      this.name = "【値入力 Lv" + level + ":" + insectType.shortName + "】";
    }

    InitHistoryItem.prototype.toSerial = function() {
      var attribute, k, serial, type;
      serial = "(";
      serial += InitHistoryItem._insectBaseChars[this.insectType.id];
      for (k in ATTR) {
        type = ATTR[k];
        attribute = this.growthPoints.filter(function(attribute) {
          return attribute.type === type;
        })[0];
        if (attribute != null) {
          serial += ("0" + String(attribute.point)).slice(-2);
        } else {
          serial += "00";
        }
      }
      serial += ")";
      return serial;
    };

    InitHistoryItem.isThisType = function(char) {
      return char === "(";
    };

    InitHistoryItem.createFromSerial = function(serial, readPos) {
      var currectPos, factory, growthPoints, id, insectType, k, point, readCharCount, type;
      currectPos = readPos;
      currectPos += 1;
      id = this._insectBaseChars.indexOf(serial[currectPos]);
      currectPos += 1;
      factory = new InsectTypeFactory();
      insectType = factory.createById(id);
      growthPoints = [];
      for (k in ATTR) {
        type = ATTR[k];
        point = Number(serial[currectPos] + serial[currectPos + 1]);
        currectPos += 2;
        if (point > 0) {
          growthPoints.push(new Attribute(type, point));
        }
      }
      currectPos += 1;
      readCharCount = currectPos - readPos;
      return [new InitHistoryItem(0, insectType, growthPoints), readCharCount];
    };

    return InitHistoryItem;

  })(HistoryItem);

  /*
  文字列変換オブジェクト
  */


  HistorySerializer = (function() {
    function HistorySerializer() {}

    HistorySerializer.prototype.getSerial = function(history) {
      var compresser, historyItem, serial, _i, _len;
      serial = "";
      for (_i = 0, _len = history.length; _i < _len; _i++) {
        historyItem = history[_i];
        serial += historyItem.toSerial();
      }
      compresser = new StrCompresser;
      return compresser.compression(serial);
    };

    HistorySerializer.prototype.readFromSerial = function(serial) {
      var compresser, historyItem, historyItemFactory, historyItems, readChars, readPos, _ref;
      compresser = new StrCompresser;
      serial = compresser.unCompression(serial);
      historyItemFactory = new HistoryItemFactory();
      historyItems = [];
      readPos = 0;
      while (readPos < serial.length) {
        _ref = historyItemFactory.createFromSerial(serial, readPos), historyItem = _ref[0], readChars = _ref[1];
        historyItems.push(historyItem);
        readPos += readChars;
      }
      return historyItems;
    };

    return HistorySerializer;

  })();

  /*
  文字列圧縮
  */


  StrCompresser = (function() {
    function StrCompresser() {}

    StrCompresser.prototype.compression = function(str) {
      var char, oldChar, out, sameCount, _i, _len;
      if ((str == null) || str === "") {
        return "";
      }
      out = "";
      sameCount = 0;
      oldChar = str[0];
      for (_i = 0, _len = str.length; _i < _len; _i++) {
        char = str[_i];
        if (char !== oldChar) {
          out += this._compressionChars(oldChar, sameCount);
          sameCount = 0;
        }
        sameCount += 1;
        oldChar = char;
      }
      out += this._compressionChars(oldChar, sameCount);
      return out;
    };

    StrCompresser.prototype._compressionChars = function(char, sameCount) {
      if (sameCount === 1) {
        return char;
      }
      if (sameCount === 2) {
        return char + char;
      }
      return char + "*" + String("0" + sameCount.toString(16)).slice(-2);
    };

    StrCompresser.prototype.unCompression = function(str) {
      var char, i, num, out, strPos, _i, _ref;
      out = "";
      strPos = 0;
      while (strPos < str.length) {
        if (str[strPos] === "*") {
          char = str[strPos - 1];
          num = parseInt(str[strPos + 1] + str[strPos + 2], 16);
          for (i = _i = 0, _ref = num - 1; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
            out += char;
          }
          strPos += 3;
        } else {
          out += str[strPos];
          strPos += 1;
        }
      }
      return out;
    };

    return StrCompresser;

  })();

  /*
  餌履歴オブジェクト　表示用オブジェクト
  */


  exports.FoodHistoryViewer = (function(_super) {
    __extends(FoodHistoryViewer, _super);

    function FoodHistoryViewer(elementId) {
      this.elementId = elementId;
      FoodHistoryViewer.__super__.constructor.call(this);
    }

    FoodHistoryViewer.prototype.onInitialize = function(foodHistory) {
      return $("#" + this.elementId + " > option").remove();
    };

    FoodHistoryViewer.prototype.onUpdate = function(foodHistory) {
      var historyItem, item, jList, severalTimesList, _i, _j, _len, _len1, _ref, _ref1, _results;
      jList = $("#" + this.elementId);
      $("option", jList).remove();
      severalTimesList = new SeveralTimesList();
      _ref = foodHistory.history;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        historyItem = _ref[_i];
        severalTimesList.push(historyItem.name);
      }
      _ref1 = severalTimesList.list;
      _results = [];
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        item = _ref1[_j];
        _results.push(jList.append($("<option>").html(item)));
      }
      return _results;
    };

    return FoodHistoryViewer;

  })(Listener);

  /*
  重複をまとめて表示するためのリスト
  */


  SeveralTimesList = (function() {
    function SeveralTimesList() {
      this.list = [];
    }

    SeveralTimesList.prototype.push = function(item) {
      var lastItem, lastItemName, times;
      if (this.list.length === 0) {
        this.list.push(item);
        return;
      }
      lastItem = this.list[this.list.length - 1];
      lastItemName = lastItem.match(new RegExp("^[^ ]+"))[0];
      if (lastItemName !== item) {
        this.list.push(item);
        return;
      }
      times = 0;
      if (lastItem.match(/\ ×\ ([0-9]+)$/)) {
        times = Number(RegExp.$1) + 1;
      } else {
        times = 2;
      }
      return this.list[this.list.length - 1] = "" + item + " × " + times;
    };

    return SeveralTimesList;

  })();

  /*
  シミュレーション結果URL　表示オブジェクト
  */


  HistoryUrlViewer = (function(_super) {
    __extends(HistoryUrlViewer, _super);

    function HistoryUrlViewer(elementId) {
      this.jText = $("#" + elementId);
      this.jText.focus(function() {
        return $(this).select();
      });
    }

    HistoryUrlViewer.prototype.onInitialize = function(sender) {
      return this.onUpdate(sender);
    };

    HistoryUrlViewer.prototype.onUpdate = function(foodHistory) {
      var serial, serializer, urlBase;
      urlBase = location.protocol + "//" + location.hostname + location.pathname;
      serializer = new HistorySerializer();
      serial = serializer.getSerial(foodHistory.history);
      return this.jText.val("" + urlBase + "?" + serial);
    };

    return HistoryUrlViewer;

  })(Listener);

  /*
  Undoの有効無効設定　表示用オブジェクト
  */


  exports.UndoEnableViewer = (function(_super) {
    __extends(UndoEnableViewer, _super);

    function UndoEnableViewer(elementId) {
      this.elementId = elementId;
      UndoEnableViewer.__super__.constructor.call(this);
    }

    UndoEnableViewer.prototype.onInitialize = function(history) {
      return this.onUpdate(history);
    };

    UndoEnableViewer.prototype.onUpdate = function(history) {
      var jButton;
      jButton = $("#" + this.elementId);
      if (history.isUndoButtonAble()) {
        return jButton.removeAttr("disabled");
      } else {
        return jButton.attr("disabled", true);
      }
    };

    return UndoEnableViewer;

  })(Listener);

  /*
  リセットの有効無効設定　表示用オブジェクト
  */


  exports.ResetEnableViewer = (function(_super) {
    __extends(ResetEnableViewer, _super);

    function ResetEnableViewer(elementId) {
      this.elementId = elementId;
      ResetEnableViewer.__super__.constructor.call(this);
    }

    ResetEnableViewer.prototype.onInitialize = function(history) {
      return this.onUpdate(history);
    };

    ResetEnableViewer.prototype.onUpdate = function(history) {
      var jButton;
      jButton = $("#" + this.elementId);
      if (history.isUndoAble()) {
        return jButton.removeAttr("disabled");
      } else {
        return jButton.attr("disabled", true);
      }
    };

    return ResetEnableViewer;

  })(Listener);

  /*
  Undo管理オブジェクト
  */


  UndoMemory = (function() {
    function UndoMemory(undoAbleObjects) {
      this.undoAbleObjects = undoAbleObjects;
      this.memory = [];
    }

    UndoMemory.prototype.getMemory = function() {
      var eachObjectMemory, object, _i, _len, _ref;
      eachObjectMemory = [];
      _ref = this.undoAbleObjects;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        object = _ref[_i];
        eachObjectMemory.push(object.getMement());
      }
      return eachObjectMemory;
    };

    UndoMemory.prototype.setUndoPoint = function(memory) {
      return this.memory.push(memory);
    };

    UndoMemory.prototype.undo = function() {
      var eachObjectMemory, i, mement, _i, _len, _results;
      if (this.memory.length === 0) {
        return;
      }
      eachObjectMemory = this.memory.pop();
      _results = [];
      for (i = _i = 0, _len = eachObjectMemory.length; _i < _len; i = ++_i) {
        mement = eachObjectMemory[i];
        _results.push(this.undoAbleObjects[i].setMement(mement));
      }
      return _results;
    };

    UndoMemory.prototype.undoAll = function() {
      var _results;
      _results = [];
      while (this.memory.length > 0) {
        _results.push(this.undo());
      }
      return _results;
    };

    return UndoMemory;

  })();

  /*
  Undoオブジェクトのインターフェース
  */


  UndoAbleObject = (function() {
    function UndoAbleObject() {}

    UndoAbleObject.prototype.getMement = function() {};

    UndoAbleObject.prototype.setMement = function(mement) {};

    return UndoAbleObject;

  })();

  /*
  虫オブジェクト
  */


  exports.Insect = (function() {
    function Insect(attributeStatusList, allGrowthPoint, foodHistory, insectTypeHolder) {
      var attributeStatus, key, undoTargetList, _ref;
      this.attributeStatusList = attributeStatusList;
      this.allGrowthPoint = allGrowthPoint;
      this.foodHistory = foodHistory;
      this.insectTypeHolder = insectTypeHolder;
      undoTargetList = [this.allGrowthPoint, this.foodHistory, this.insectTypeHolder];
      _ref = this.attributeStatusList;
      for (key in _ref) {
        attributeStatus = _ref[key];
        undoTargetList.push(attributeStatus);
      }
      this.undoMemory = new UndoMemory(undoTargetList);
    }

    Insect.prototype.eat = function(food) {
      var addPoint, attribute, foodEated, memory, _i, _len, _ref;
      memory = this.undoMemory.getMemory();
      foodEated = false;
      _ref = food.eatSotedAttributes();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        attribute = _ref[_i];
        addPoint = Math.min(this.allGrowthPoint.getLevelOfSpace(), attribute.point);
        this.attributeStatusList[attribute.type].add(addPoint);
        if (addPoint > 0) {
          foodEated = true;
        }
      }
      if (foodEated) {
        this.foodHistory.push(new FoodHistoryItem(food));
        return this.undoMemory.setUndoPoint(memory);
      }
    };

    Insect.prototype.levelUp = function(insectType) {
      this.undoMemory.setUndoPoint(this.undoMemory.getMemory());
      this.attributeStatusList[ATTR.POWER].setMinGrowthPoint(insectType.minPowerGrowthPoint);
      this.attributeStatusList[ATTR.STAMINA].setMinGrowthPoint(insectType.minStaminaGrowthPoint);
      this.attributeStatusList[ATTR.SPEED].setMinGrowthPoint(insectType.minSpeedGrowthPoint);
      this.insectTypeHolder.levelUp(insectType);
      this.allGrowthPoint.levelUp();
      return this.foodHistory.push(new LevelUpHistoryItem(this.allGrowthPoint.level, insectType));
    };

    Insect.prototype.undo = function() {
      return this.undoMemory.undo();
    };

    Insect.prototype.reset = function() {
      return this.undoMemory.undoAll();
    };

    Insect.prototype.inputInit = function(insectType, growthPointList) {
      var allPoint, attribute, i, _i, _j, _len, _ref;
      this.reset();
      this.undoMemory.setUndoPoint(this.undoMemory.getMemory());
      allPoint = 0;
      for (_i = 0, _len = growthPointList.length; _i < _len; _i++) {
        attribute = growthPointList[_i];
        this.attributeStatusList[attribute.type].add(attribute.point);
        allPoint += Number(attribute.point);
      }
      this.attributeStatusList[ATTR.POWER].setMinGrowthPoint(insectType.minPowerGrowthPoint);
      this.attributeStatusList[ATTR.STAMINA].setMinGrowthPoint(insectType.minStaminaGrowthPoint);
      this.attributeStatusList[ATTR.SPEED].setMinGrowthPoint(insectType.minSpeedGrowthPoint);
      for (i = _j = 1, _ref = this._getLevelByPoint(allPoint); 1 <= _ref ? _j < _ref : _j > _ref; i = 1 <= _ref ? ++_j : --_j) {
        this.insectTypeHolder.levelUp(insectType);
        this.allGrowthPoint.levelUp();
      }
      return this.foodHistory.push(new InitHistoryItem(this.allGrowthPoint.level, insectType, growthPointList));
    };

    Insect.prototype._getLevelByPoint = function(growthPoint) {
      var i, level, levelLimit, maxLevel, _i, _len;
      level = 1;
      for (i = _i = 0, _len = LEVEL_LIMIT_LIST.length; _i < _len; i = ++_i) {
        levelLimit = LEVEL_LIMIT_LIST[i];
        if (growthPoint >= levelLimit) {
          level = i + 2;
        }
      }
      maxLevel = LEVEL_LIMIT_LIST.length;
      if (level > maxLevel) {
        level = maxLevel;
      }
      return level;
    };

    Insect.prototype.getHistory = function() {
      var serializer;
      serializer = new HistorySerializer();
      return serializer.getSerial(this.foodHistory.history);
    };

    Insect.prototype.setHistory = function(serial) {
      var historyItem, historyItems, serializer, _i, _len, _results;
      serializer = new HistorySerializer();
      historyItems = serializer.readFromSerial(serial);
      this.reset();
      _results = [];
      for (_i = 0, _len = historyItems.length; _i < _len; _i++) {
        historyItem = historyItems[_i];
        if (historyItem instanceof FoodHistoryItem) {
          this.eat(historyItem.food);
        }
        if (historyItem instanceof LevelUpHistoryItem) {
          this.levelUp(historyItem.insectType);
        }
        if (historyItem instanceof InitHistoryItem) {
          _results.push(this.inputInit(historyItem.insectType, historyItem.growthPoints));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    return Insect;

  })();

  /*
  属性とポイントのペア
  */


  exports.Attribute = (function() {
    function Attribute(type, point) {
      this.type = type;
      this.point = point;
    }

    return Attribute;

  })();

  /*
  虫餌オブジェクト
  */


  exports.Food = (function() {
    function Food(id, name, attributes) {
      var allPoint, attribute, _i, _len;
      this.id = id;
      this.name = name;
      this.attributes = attributes;
      allPoint = 0;
      for (_i = 0, _len = attributes.length; _i < _len; _i++) {
        attribute = attributes[_i];
        allPoint += attribute.point;
      }
      if (allPoint !== 0) {
        throw "UnlikelyFood";
      }
    }

    Food.prototype.eatSotedAttributes = function() {
      var _this = this;
      return this.attributes.sort(function(attribute1, attribute2) {
        return _this.sortOrder(attribute2) - _this.sortOrder(attribute1);
      });
    };

    Food.prototype.sortOrder = function(attribute) {
      var order, _ref;
      order = 0;
      if (attribute.point < 0) {
        order += 100;
      }
      order += Math.abs(attribute.point * 10);
      if ((_ref = attribute.type) === ATTR.POWER || _ref === ATTR.STAMINA || _ref === ATTR.SPEED) {
        order += 1;
      }
      return order;
    };

    return Food;

  })();

  /*
  虫餌オブジェクト工場
  */


  exports.FoodFactory = (function() {
    function FoodFactory() {
      this._foods = [];
      this._foods.push(new Food(1, "力の虫餌・火", [new Attribute(ATTR.POWER, +1), new Attribute(ATTR.FIRE, +1), new Attribute(ATTR.WATER, -2)]));
      this._foods.push(new Food(2, "力の虫餌・火炎", [new Attribute(ATTR.POWER, +1), new Attribute(ATTR.FIRE, +2), new Attribute(ATTR.WATER, -3)]));
      this._foods.push(new Food(3, "力の上虫餌", [new Attribute(ATTR.POWER, +2), new Attribute(ATTR.SPEED, -1), new Attribute(ATTR.FIRE, -1)]));
      this._foods.push(new Food(4, "力の上虫餌・火", [new Attribute(ATTR.POWER, +2), new Attribute(ATTR.FIRE, +1), new Attribute(ATTR.SPEED, -3)]));
      this._foods.push(new Food(5, "体の虫餌・龍", [new Attribute(ATTR.STAMINA, +1), new Attribute(ATTR.DRAGON, +1), new Attribute(ATTR.FIRE, -2)]));
      this._foods.push(new Food(6, "体の虫餌・破龍", [new Attribute(ATTR.STAMINA, +1), new Attribute(ATTR.DRAGON, +2), new Attribute(ATTR.FIRE, -3)]));
      this._foods.push(new Food(7, "体の虫餌・水", [new Attribute(ATTR.STAMINA, +1), new Attribute(ATTR.WATER, +1), new Attribute(ATTR.THUNDER, -2)]));
      this._foods.push(new Food(8, "体の上虫餌", [new Attribute(ATTR.STAMINA, +2), new Attribute(ATTR.POWER, -1), new Attribute(ATTR.WATER, -1)]));
      this._foods.push(new Food(9, "体の上虫餌・水", [new Attribute(ATTR.STAMINA, +2), new Attribute(ATTR.WATER, +1), new Attribute(ATTR.POWER, -3)]));
      this._foods.push(new Food(10, "速の虫餌・流水", [new Attribute(ATTR.SPEED, +1), new Attribute(ATTR.WATER, +2), new Attribute(ATTR.THUNDER, -3)]));
      this._foods.push(new Food(11, "速の虫餌・雷", [new Attribute(ATTR.SPEED, +1), new Attribute(ATTR.THUNDER, +1), new Attribute(ATTR.ICE, -2)]));
      this._foods.push(new Food(12, "速の虫餌・雷光", [new Attribute(ATTR.SPEED, +1), new Attribute(ATTR.THUNDER, +2), new Attribute(ATTR.ICE, -3)]));
      this._foods.push(new Food(13, "速の虫餌・氷", [new Attribute(ATTR.SPEED, +1), new Attribute(ATTR.ICE, +1), new Attribute(ATTR.DRAGON, -2)]));
      this._foods.push(new Food(14, "速の虫餌・氷結", [new Attribute(ATTR.SPEED, +1), new Attribute(ATTR.ICE, +2), new Attribute(ATTR.DRAGON, -3)]));
      this._foods.push(new Food(15, "速の上虫餌", [new Attribute(ATTR.SPEED, +2), new Attribute(ATTR.STAMINA, -1), new Attribute(ATTR.THUNDER, -1)]));
      this._foods.push(new Food(16, "速の上虫餌・雷", [new Attribute(ATTR.SPEED, +2), new Attribute(ATTR.THUNDER, +1), new Attribute(ATTR.STAMINA, -3)]));
      this._foods.push(new Food(17, "虫餌・火炎", [new Attribute(ATTR.FIRE, +2), new Attribute(ATTR.WATER, -1), new Attribute(ATTR.ICE, -1)]));
      this._foods.push(new Food(18, "虫餌・流水", [new Attribute(ATTR.WATER, +2), new Attribute(ATTR.THUNDER, -1), new Attribute(ATTR.DRAGON, -1)]));
      this._foods.push(new Food(19, "虫餌・雷光", [new Attribute(ATTR.THUNDER, +2), new Attribute(ATTR.SPEED, -1), new Attribute(ATTR.ICE, -1)]));
      this._foods.push(new Food(20, "虫餌・氷結", [new Attribute(ATTR.ICE, +2), new Attribute(ATTR.STAMINA, -1), new Attribute(ATTR.DRAGON, -1)]));
      this._foods.push(new Food(21, "虫餌・破龍", [new Attribute(ATTR.DRAGON, +2), new Attribute(ATTR.POWER, -1), new Attribute(ATTR.FIRE, -1)]));
    }

    FoodFactory.prototype.create = function(name) {
      var food, _i, _len, _ref;
      _ref = this._foods;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        food = _ref[_i];
        if (food.name === name) {
          return food;
        }
      }
    };

    FoodFactory.prototype.createById = function(id) {
      var food, _i, _len, _ref;
      _ref = this._foods;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        food = _ref[_i];
        if (food.id === id) {
          return food;
        }
      }
    };

    return FoodFactory;

  })();

  /*
  虫種類の保持
  */


  exports.InsectTypeHolder = (function(_super) {
    __extends(InsectTypeHolder, _super);

    function InsectTypeHolder(insectType) {
      this.insectType = insectType;
      InsectTypeHolder.__super__.constructor.call(this);
      this.type = "InsectHolder";
      this.level = 1;
    }

    InsectTypeHolder.prototype.levelUp = function(insectType) {
      this.insectType = insectType;
      this.level += 1;
      return this.notifyUpdate();
    };

    InsectTypeHolder.prototype.getNextInsectType = function() {
      var childInsectType, nextInsectType, _i, _len, _ref;
      nextInsectType = [];
      _ref = this.insectType.getChild();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        childInsectType = _ref[_i];
        if (childInsectType.level === this.level + 1) {
          nextInsectType.push(childInsectType);
        }
      }
      if (nextInsectType.length === 0) {
        nextInsectType.push(this.insectType);
      }
      return nextInsectType;
    };

    InsectTypeHolder.prototype.getMement = function() {
      return [this.insectType, this.level];
    };

    InsectTypeHolder.prototype.setMement = function(mement) {
      this.insectType = mement[0], this.level = mement[1];
      return this.notifyUpdate();
    };

    return InsectTypeHolder;

  })(ListenedItem);

  /*
  虫種類オブジェクト
  */


  InsectType = (function() {
    function InsectType(id, name, shortName, level, minPower, minStamina, minSpeed, skill) {
      this.id = id;
      this.name = name;
      this.shortName = shortName;
      this.level = level;
      this.minPower = minPower;
      this.minStamina = minStamina;
      this.minSpeed = minSpeed;
      this.skill = skill;
      this.childType = [];
      this.minPowerGrowthPoint = this.minPower - 60;
      this.minStaminaGrowthPoint = this.minStamina - 60;
      this.minSpeedGrowthPoint = this.minSpeed - 60;
    }

    InsectType.prototype.addChild = function(childType) {
      return this.childType.push(childType);
    };

    InsectType.prototype.getChild = function() {
      return this.childType;
    };

    InsectType.prototype.getChildByName = function(searchName) {
      var child, searchResult, _i, _len, _ref;
      if (searchName === this.shortName) {
        return this;
      }
      _ref = this.getChild();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        child = _ref[_i];
        searchResult = child.getChildByName(searchName);
        if (searchResult != null) {
          return searchResult;
        }
      }
      return null;
    };

    InsectType.prototype.getChildById = function(id) {
      var child, searchResult, _i, _len, _ref;
      if (id === this.id) {
        return this;
      }
      _ref = this.getChild();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        child = _ref[_i];
        searchResult = child.getChildById(id);
        if (searchResult != null) {
          return searchResult;
        }
      }
      return null;
    };

    InsectType.prototype.getAbleChilds = function(targetLevel, targetGrowthPointList) {
      var ableChilds, child, _i, _len, _ref;
      ableChilds = [];
      if (this._checkAbleInsect(targetLevel, targetGrowthPointList)) {
        ableChilds.push(this);
      }
      _ref = this.getChild();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        child = _ref[_i];
        ableChilds = ableChilds.concat(child.getAbleChilds(targetLevel, targetGrowthPointList));
      }
      return ableChilds;
    };

    InsectType.prototype._checkAbleInsect = function(targetLevel, targetGrowthPointList) {
      var nextEvoluteLevel;
      if (this.childType.length > 0) {
        nextEvoluteLevel = this.childType[0].level;
      } else {
        nextEvoluteLevel = 99;
      }
      if (!((this.level <= targetLevel && targetLevel < nextEvoluteLevel))) {
        return false;
      }
      if (targetGrowthPointList[ATTR.POWER] < this.minPowerGrowthPoint) {
        return false;
      }
      if (targetGrowthPointList[ATTR.STAMINA] < this.minStaminaGrowthPoint) {
        return false;
      }
      if (targetGrowthPointList[ATTR.SPEED] < this.minSpeedGrowthPoint) {
        return false;
      }
      return true;
    };

    return InsectType;

  })();

  /*
  Null虫種類オブジェクト
  */


  exports.NullInsectType = (function(_super) {
    __extends(NullInsectType, _super);

    function NullInsectType() {
      NullInsectType.__super__.constructor.call(this, 0, "", "", 1, 999, 999, 999, "");
    }

    return NullInsectType;

  })(InsectType);

  /*
  レベルアップボタン一覧
  */


  exports.LevelUpButtonsTypeChanger = (function(_super) {
    __extends(LevelUpButtonsTypeChanger, _super);

    function LevelUpButtonsTypeChanger(buttons) {
      this.buttons = buttons;
      LevelUpButtonsTypeChanger.__super__.constructor.call(this);
    }

    LevelUpButtonsTypeChanger.prototype.onInitialize = function(sender) {
      return this.onUpdate(sender);
    };

    LevelUpButtonsTypeChanger.prototype.onUpdate = function(insectTypeHolder) {
      var button, i, insectType, nextInsectTypes, _i, _len, _ref, _results;
      nextInsectTypes = insectTypeHolder.getNextInsectType();
      _ref = this.buttons;
      _results = [];
      for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
        button = _ref[i];
        insectType = nextInsectTypes[i];
        if (i < nextInsectTypes.length) {
          _results.push(button.set("レベルアップ" + insectType.shortName, insectType));
        } else {
          _results.push(button.set("-", new NullInsectType()));
        }
      }
      return _results;
    };

    return LevelUpButtonsTypeChanger;

  })(Listener);

  /*
  レベルアップボタン
  */


  exports.LevelUpButton = (function(_super) {
    __extends(LevelUpButton, _super);

    function LevelUpButton(name, nextInsectType) {
      this.name = name;
      this.nextInsectType = nextInsectType;
      LevelUpButton.__super__.constructor.call(this);
      this.statusPoints = {};
      this.statusPoints[ATTR.POWER] = 0;
      this.statusPoints[ATTR.STAMINA] = 0;
      this.statusPoints[ATTR.SPEED] = 0;
      this.isLevelUpAble = false;
    }

    LevelUpButton.prototype.set = function(name, nextInsectType) {
      this.name = name;
      this.nextInsectType = nextInsectType;
      return this.notifyUpdate();
    };

    LevelUpButton.prototype.isEnabled = function() {
      if (this.statusPoints[ATTR.POWER] < this.nextInsectType.minPower) {
        return false;
      }
      if (this.statusPoints[ATTR.STAMINA] < this.nextInsectType.minStamina) {
        return false;
      }
      if (this.statusPoints[ATTR.SPEED] < this.nextInsectType.minSpeed) {
        return false;
      }
      if (this.isLevelUpAble === false) {
        return false;
      }
      return true;
    };

    LevelUpButton.prototype.onInitialize = function(sender) {
      return this.onUpdate(sender);
    };

    LevelUpButton.prototype.onUpdate = function(sender) {
      if (sender.type === "Point") {
        this.onUpdateByPoint(sender);
      }
      if (sender.type === "Status") {
        this.onUpdateByAttributeStatus(sender);
      }
      return this.notifyUpdate();
    };

    LevelUpButton.prototype.onUpdateByPoint = function(allPoint) {
      return this.isLevelUpAble = allPoint.isLevelUpAble();
    };

    LevelUpButton.prototype.onUpdateByAttributeStatus = function(attributeStatus) {
      return this.statusPoints[attributeStatus.attribute] = attributeStatus.status;
    };

    return LevelUpButton;

  })(ListenedItem);

  /*
  レベルアップボタン　表示オブジェクト
  */


  exports.LevelUpButtonViewer = (function(_super) {
    __extends(LevelUpButtonViewer, _super);

    function LevelUpButtonViewer(elementId) {
      this.elementId = elementId;
      LevelUpButtonViewer.__super__.constructor.call(this);
    }

    LevelUpButtonViewer.prototype.onInitialize = function(levelUpButton) {
      return this.onUpdate(levelUpButton);
    };

    LevelUpButtonViewer.prototype.onUpdate = function(levelUpButton) {
      var jButton;
      jButton = $("#" + this.elementId);
      jButton.val(levelUpButton.name);
      jButton.data("nextInsectType", levelUpButton.nextInsectType);
      if (levelUpButton.isEnabled()) {
        return jButton.removeAttr("disabled");
      } else {
        return jButton.attr("disabled", true);
      }
    };

    return LevelUpButtonViewer;

  })(Listener);

  /*
  進化アイテム
  */


  exports.InsectEvolutionItem = (function(_super) {
    __extends(InsectEvolutionItem, _super);

    function InsectEvolutionItem(condInsectType) {
      this.condInsectType = condInsectType;
      InsectEvolutionItem.__super__.constructor.call(this);
      this.statusPoints = {};
      this.statusPoints[ATTR.POWER] = 0;
      this.statusPoints[ATTR.STAMINA] = 0;
      this.statusPoints[ATTR.SPEED] = 0;
      this.currentInsectType = new NullInsectType();
    }

    InsectEvolutionItem.prototype.CheckEvolution = function() {
      if (this.statusPoints[ATTR.POWER] < this.condInsectType.minPower) {
        return false;
      }
      if (this.statusPoints[ATTR.STAMINA] < this.condInsectType.minStamina) {
        return false;
      }
      if (this.statusPoints[ATTR.SPEED] < this.condInsectType.minSpeed) {
        return false;
      }
      return true;
    };

    InsectEvolutionItem.prototype.CheckCurrent = function() {
      return this.currentInsectType.shortName === this.condInsectType.shortName;
    };

    InsectEvolutionItem.prototype.onInitialize = function(sender) {
      return this.onUpdate(sender);
    };

    InsectEvolutionItem.prototype.onUpdate = function(sender) {
      if (sender.type === "InsectHolder") {
        this.onUpdateByInsectHolder(sender);
      }
      if (sender.type === "Status") {
        this.onUpdateByAttributeStatus(sender);
      }
      return this.notifyUpdate();
    };

    InsectEvolutionItem.prototype.onUpdateByInsectHolder = function(insectTypeHolder) {
      return this.currentInsectType = insectTypeHolder.insectType;
    };

    InsectEvolutionItem.prototype.onUpdateByAttributeStatus = function(attributeStatus) {
      return this.statusPoints[attributeStatus.attribute] = attributeStatus.status;
    };

    return InsectEvolutionItem;

  })(ListenedItem);

  /*
  進化アイテム　表示オブジェクト
  */


  exports.InsectEvolutionItemViewer = (function(_super) {
    __extends(InsectEvolutionItemViewer, _super);

    function InsectEvolutionItemViewer(elementId) {
      this.elementId = elementId;
      InsectEvolutionItemViewer.__super__.constructor.call(this);
    }

    InsectEvolutionItemViewer.prototype.onInitialize = function(insectEvolutionItem) {
      return this.onUpdate(insectEvolutionItem);
    };

    InsectEvolutionItemViewer.prototype.onUpdate = function(insectEvolutionItem) {
      var jEvolutionItem;
      jEvolutionItem = $("#" + this.elementId);
      jEvolutionItem.css("color", (insectEvolutionItem.CheckEvolution() ? "black" : "silver"));
      return jEvolutionItem.css("font-weight", (insectEvolutionItem.CheckCurrent() ? "bold" : "normal"));
    };

    return InsectEvolutionItemViewer;

  })(Listener);

  /*
  虫種類オブジェクト建築指揮者
  */


  exports.InsectTypeFactory = (function() {
    function InsectTypeFactory() {
      var c1, c1_1, c1_2, c2, c2_1, c2_2, c3, c3_1, c3_2, c4, c4_1;
      this.root = new InsectType(1, "マルドローン/クルドローン", "(初期)", 1, 60, 60, 60, "無し");
      c1 = new InsectType(2, "ザミールビートル/アルマスタッグ", "(攻)", 4, 78, 60, 60, "攻撃UP【小】");
      c1_1 = new InsectType(3, "ケーニヒゴアビートル/モナークブルスタッグ", "(攻＋)", 7, 96, 60, 60, "攻撃UP【大】");
      c1_2 = new InsectType(4, "フィルカーノ/レジナヴァランテ", "(攻回)", 7, 87, 66, 63, "攻撃UP【中】 / 回復UP【小】");
      c2 = new InsectType(5, "ハルキータ/ガシルドーレ", "(体)", 4, 60, 78, 60, "スタミナUP【小】");
      c2_1 = new InsectType(6, "ドルンキータ/ドゥンクラーブ", "(体＋)", 7, 60, 96, 60, "スタミナUP【大】");
      c2_2 = new InsectType(7, "アルジョアーニャ/ウカドゥーレ", "(体回)", 7, 69, 84, 63, "スタミナUP【中】 / 回復UP【小】");
      c3 = new InsectType(8, "ガルーヘル/カゼキリバネ", "(速)", 4, 60, 60, 78, "スピードUP【小】");
      c3_1 = new InsectType(9, "メイヴァーチル/オオシナト", "(速＋)", 7, 60, 60, 96, "スピードUP【大】");
      c3_2 = new InsectType(10, "ヴァンリエール/シナトモドキ", "(速回)", 7, 69, 66, 81, "スピードUP【中】 / 回復UP【小】");
      c4 = new InsectType(11, "エボマルドローン/エボクルドローン", "(汎)", 4, 69, 66, 63, "全ステータスUP【小】");
      c4_1 = new InsectType(12, "アルジャーロン/エルドラーン", "(汎＋)", 7, 78, 72, 66, "全ステータスUP【中】 / 回復UP【大】");
      this.root.addChild(c1);
      c1.addChild(c1_1);
      c1.addChild(c1_2);
      this.root.addChild(c2);
      c2.addChild(c2_1);
      c2.addChild(c2_2);
      this.root.addChild(c3);
      c3.addChild(c3_1);
      c3.addChild(c3_2);
      this.root.addChild(c4);
      c4.addChild(c4_1);
    }

    InsectTypeFactory.prototype.createRoot = function() {
      return this.root;
    };

    InsectTypeFactory.prototype.createById = function(id) {
      return this.root.getChildById(id);
    };

    return InsectTypeFactory;

  })();

  /*
  虫オブジェクト建造者
  */


  exports.InsectBuilder = (function() {
    function InsectBuilder() {
      var insectTypeFactory;
      this.attributeStatusList = null;
      this.allGrowthPoint = null;
      this.foodHistory = null;
      this.insectTypeHolder = null;
      insectTypeFactory = new InsectTypeFactory();
      this.rootInsectType = insectTypeFactory.createRoot();
    }

    InsectBuilder.prototype.initAttributeStatusList = function() {
      this.attributeStatusList = {};
      this.attributeStatusList[ATTR.POWER] = new AttributeStatus("パワー", ATTR.POWER, 60, 9, 9);
      this.attributeStatusList[ATTR.STAMINA] = new AttributeStatus("スタミナ", ATTR.STAMINA, 60, 6, 6);
      this.attributeStatusList[ATTR.SPEED] = new AttributeStatus("スピード", ATTR.SPEED, 60, 3, 3);
      this.attributeStatusList[ATTR.FIRE] = new AttributeStatus("火属性", ATTR.FIRE, 0, 3, 2);
      this.attributeStatusList[ATTR.WATER] = new AttributeStatus("水属性", ATTR.WATER, 0, 3, 2);
      this.attributeStatusList[ATTR.THUNDER] = new AttributeStatus("雷属性", ATTR.THUNDER, 0, 6, 4);
      this.attributeStatusList[ATTR.ICE] = new AttributeStatus("氷属性", ATTR.ICE, 0, 6, 4);
      this.attributeStatusList[ATTR.DRAGON] = new AttributeStatus("龍属性", ATTR.DRAGON, 0, 9, 6);
      this.attributeStatusList[ATTR.POWER].addListener(new AttributeStatusViewer("trPower"));
      this.attributeStatusList[ATTR.STAMINA].addListener(new AttributeStatusViewer("trStamina"));
      this.attributeStatusList[ATTR.SPEED].addListener(new AttributeStatusViewer("trSpeed"));
      this.attributeStatusList[ATTR.FIRE].addListener(new AttributeStatusViewer("trFire"));
      this.attributeStatusList[ATTR.WATER].addListener(new AttributeStatusViewer("trWater"));
      this.attributeStatusList[ATTR.THUNDER].addListener(new AttributeStatusViewer("trThunder"));
      this.attributeStatusList[ATTR.ICE].addListener(new AttributeStatusViewer("trIce"));
      return this.attributeStatusList[ATTR.DRAGON].addListener(new AttributeStatusViewer("trDragon"));
    };

    InsectBuilder.prototype.initAllGrowthPoint = function() {
      var attributeStatus, key, _ref, _results;
      this.allGrowthPoint = new AllGrowthPoint(LEVEL_LIMIT_LIST);
      this.allGrowthPoint.addListener(new AllGrowthPointViewer("tblAllGrowthPoint"));
      _ref = this.attributeStatusList;
      _results = [];
      for (key in _ref) {
        attributeStatus = _ref[key];
        _results.push(attributeStatus.addListener(this.allGrowthPoint));
      }
      return _results;
    };

    InsectBuilder.prototype.initFoodHistory = function() {
      this.foodHistory = new FoodHistory();
      this.foodHistory.addListener(new FoodHistoryViewer("lstFoodHistory"));
      this.foodHistory.addListener(new UndoEnableViewer("btnUndo"));
      this.foodHistory.addListener(new ResetEnableViewer("btnReset"));
      return this.foodHistory.addListener(new HistoryUrlViewer("txtResultUrl"));
    };

    InsectBuilder.prototype.initInsectTypeHolder = function() {
      return this.insectTypeHolder = new InsectTypeHolder(this.rootInsectType);
    };

    InsectBuilder.prototype.addLevelUpButtons = function() {
      var buttons, buttonsTypeChanger;
      buttons = [];
      buttons.push(this._buildButton("btnLevelUp0"));
      buttons.push(this._buildButton("btnLevelUp1"));
      buttons.push(this._buildButton("btnLevelUp2"));
      buttons.push(this._buildButton("btnLevelUp3"));
      buttonsTypeChanger = new LevelUpButtonsTypeChanger(buttons);
      return this.insectTypeHolder.addListener(buttonsTypeChanger);
    };

    InsectBuilder.prototype._buildButton = function(elementId) {
      var button;
      button = new LevelUpButton("-", new NullInsectType());
      button.addListener(new LevelUpButtonViewer(elementId));
      this.allGrowthPoint.addListener(button);
      this.attributeStatusList[ATTR.POWER].addListener(button);
      this.attributeStatusList[ATTR.STAMINA].addListener(button);
      this.attributeStatusList[ATTR.SPEED].addListener(button);
      return button;
    };

    InsectBuilder.prototype.addEvolutionItems = function() {
      this._buildEvolutionItem("lblEvo0");
      this._buildEvolutionItem("lblEvo1");
      this._buildEvolutionItem("lblEvo2");
      this._buildEvolutionItem("lblEvo3");
      this._buildEvolutionItem("lblEvo4");
      this._buildEvolutionItem("lblEvo5");
      this._buildEvolutionItem("lblEvo6");
      this._buildEvolutionItem("lblEvo7");
      this._buildEvolutionItem("lblEvo8");
      this._buildEvolutionItem("lblEvo9");
      this._buildEvolutionItem("lblEvo10");
      return this._buildEvolutionItem("lblEvo11");
    };

    InsectBuilder.prototype._buildEvolutionItem = function(elementId) {
      var insectEvolutionItem, insectType, name;
      name = "(" + $("#" + elementId).text() + ")";
      insectType = this.rootInsectType.getChildByName(name);
      insectEvolutionItem = new InsectEvolutionItem(insectType);
      insectEvolutionItem.addListener(new InsectEvolutionItemViewer(elementId));
      this.insectTypeHolder.addListener(insectEvolutionItem);
      this.attributeStatusList[ATTR.POWER].addListener(insectEvolutionItem);
      this.attributeStatusList[ATTR.STAMINA].addListener(insectEvolutionItem);
      this.attributeStatusList[ATTR.SPEED].addListener(insectEvolutionItem);
      return insectEvolutionItem;
    };

    InsectBuilder.prototype.getResult = function() {
      if (this.attributeStatusList === null) {
        throw "not initialized attributeStatusList";
      }
      if (this.allGrowthPoint === null) {
        throw "not initialized allGrowthPoint";
      }
      if (this.foodHistory === null) {
        throw "not initialized foodHistory";
      }
      if (this.insectTypeHolder === null) {
        throw "not initialized insectTypeHolder";
      }
      return new Insect(this.attributeStatusList, this.allGrowthPoint, this.foodHistory, this.insectTypeHolder);
    };

    return InsectBuilder;

  })();

  /*
  虫オブジェクト建築指揮者
  */


  exports.InsectBuildDirector = (function() {
    function InsectBuildDirector(builder) {
      this.builder = builder;
    }

    InsectBuildDirector.prototype.construct = function() {
      this.builder.initAttributeStatusList();
      this.builder.initAllGrowthPoint();
      this.builder.initFoodHistory();
      this.builder.initInsectTypeHolder();
      this.builder.addLevelUpButtons();
      this.builder.addEvolutionItems();
      return this.builder.getResult();
    };

    return InsectBuildDirector;

  })();

  /*
  数値入力の正当性チェック
  */


  exports.NumberRangeValidViewer = (function(_super) {
    __extends(NumberRangeValidViewer, _super);

    function NumberRangeValidViewer(selector, min, max) {
      var _this = this;
      this.min = min;
      this.max = max;
      NumberRangeValidViewer.__super__.constructor.call(this);
      this.jText = $(selector);
      this.jText.change(function() {
        return _this.onChange();
      });
      this.jText.keyup(function() {
        return _this.onChange();
      });
    }

    NumberRangeValidViewer.prototype.isValid = function() {
      var val, _ref;
      val = this.jText.val();
      if (val === "" || isNaN(val)) {
        return false;
      }
      if (!((this.min <= (_ref = Number(val)) && _ref <= this.max))) {
        return false;
      }
      return true;
    };

    NumberRangeValidViewer.prototype.onChange = function() {
      if (this.isValid()) {
        this.jText.css("background-color", "");
      } else {
        this.jText.css("background-color", "pink");
      }
      return this.notifyUpdate();
    };

    return NumberRangeValidViewer;

  })(ListenedItem);

  /*
  全体合計の正当性チェック
  */


  exports.NumberSumMaxValidViewer = (function(_super) {
    __extends(NumberSumMaxValidViewer, _super);

    function NumberSumMaxValidViewer(selectores, errorProviderSelector, max) {
      var i, text, _i, _len, _ref,
        _this = this;
      this.max = max;
      NumberSumMaxValidViewer.__super__.constructor.call(this);
      this.summary = [];
      this.jTexts = $(selectores);
      _ref = this.jTexts;
      for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
        text = _ref[i];
        text.uniqueNo = i;
        this.summary[i] = text.value;
      }
      this.jTexts.change(function(e) {
        return _this.onChange(e.target);
      });
      this.jTexts.keyup(function(e) {
        return _this.onChange(e.target);
      });
      this.jErrorProvider = $(errorProviderSelector);
      this.onChange(this.jTexts[0]);
    }

    NumberSumMaxValidViewer.prototype.isValid = function() {
      var i, sum, _i, _len, _ref;
      sum = 0;
      _ref = this.summary;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        i = _ref[_i];
        sum += Number(i);
      }
      if (!isNaN(sum) && this.max < sum) {
        return false;
      }
      return true;
    };

    NumberSumMaxValidViewer.prototype.onChange = function(target) {
      this.summary[target.uniqueNo] = target.value;
      if (this.isValid()) {
        this.jErrorProvider.text(" ");
      } else {
        this.jErrorProvider.text("※合計 " + this.max + " 以内で入力してください。");
      }
      return this.notifyUpdate();
    };

    return NumberSumMaxValidViewer;

  })(ListenedItem);

  /*
  正当性チェックが必要なボタン
  */


  exports.RequireValidationButtonViewer = (function(_super) {
    __extends(RequireValidationButtonViewer, _super);

    function RequireValidationButtonViewer(elementId, validaters) {
      var validater, _i, _len, _ref;
      this.elementId = elementId;
      this.validaters = validaters;
      RequireValidationButtonViewer.__super__.constructor.call(this);
      _ref = this.validaters;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        validater = _ref[_i];
        validater.addListener(this);
      }
    }

    RequireValidationButtonViewer.prototype.onInitialize = function(sender) {
      return this.onUpdate(sender);
    };

    RequireValidationButtonViewer.prototype.onUpdate = function(sender) {
      var isAllValid, jButton, validater, _i, _len, _ref;
      isAllValid = true;
      _ref = this.validaters;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        validater = _ref[_i];
        isAllValid = isAllValid && validater.isValid();
      }
      jButton = $("#" + this.elementId);
      if (isAllValid) {
        return jButton.removeAttr("disabled");
      } else {
        return jButton.attr("disabled", true);
      }
    };

    return RequireValidationButtonViewer;

  })(Listener);

  /*
  利用可能虫種類を列挙する
  */


  exports.AbleInsectTypeLister = (function(_super) {
    __extends(AbleInsectTypeLister, _super);

    function AbleInsectTypeLister(levelLimitList, rootInsectType) {
      this.levelLimitList = levelLimitList;
      this.rootInsectType = rootInsectType;
      AbleInsectTypeLister.__super__.constructor.call(this);
      this.growthPointList = {};
      this.growthPointList[ATTR.POWER] = 0;
      this.growthPointList[ATTR.STAMINA] = 0;
      this.growthPointList[ATTR.SPEED] = 0;
      this.ableList = [this.rootInsectType];
    }

    AbleInsectTypeLister.prototype.setGrowthPoint = function(attribute, point) {
      if (!isNaN(point) || point === "") {
        this.growthPointList[attribute] = Number(point);
      } else {
        this.growthPointList[attribute] = 0;
      }
      this.ableList = this.rootInsectType.getAbleChilds(this._getLevel(), this.growthPointList);
      return this.notifyUpdate();
    };

    AbleInsectTypeLister.prototype.getAbleList = function() {
      return this.ableList;
    };

    AbleInsectTypeLister.prototype._getLevel = function() {
      var allPoint, attributes, i, level, levelLimit, point, _i, _len, _ref, _ref1;
      allPoint = 0;
      _ref = this.growthPointList;
      for (attributes in _ref) {
        point = _ref[attributes];
        allPoint += point;
      }
      level = 1;
      _ref1 = this.levelLimitList;
      for (i = _i = 0, _len = _ref1.length; _i < _len; i = ++_i) {
        levelLimit = _ref1[i];
        if (allPoint >= levelLimit) {
          level = i + 2;
        }
      }
      return level;
    };

    return AbleInsectTypeLister;

  })(ListenedItem);

  /*
  利用可能虫種類を列挙する　表示オブジェクト
  */


  exports.AbleInsectTypeListerViewer = (function(_super) {
    __extends(AbleInsectTypeListerViewer, _super);

    function AbleInsectTypeListerViewer(elementId) {
      AbleInsectTypeListerViewer.__super__.constructor.call(this);
      this.jCombo = $("#" + elementId);
    }

    AbleInsectTypeListerViewer.prototype.onInitialize = function(sender) {
      return this.onUpdate(sender);
    };

    AbleInsectTypeListerViewer.prototype.onUpdate = function(ableInsectTypeLister) {
      var ableInsectNames, currentInsectName, insectType, _i, _len, _ref;
      currentInsectName = this.jCombo.val();
      ableInsectNames = [];
      this.jCombo.find("option").remove();
      _ref = ableInsectTypeLister.getAbleList();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        insectType = _ref[_i];
        ableInsectNames.push(insectType.shortName);
        this.jCombo.append("<option value='" + insectType.shortName + "'>" + insectType.shortName + " " + insectType.name + "</option>").data("insectType", insectType);
      }
      if (__indexOf.call(ableInsectNames, currentInsectName) >= 0) {
        return this.jCombo.val(currentInsectName);
      } else {
        return this.jCombo.prop("selectedIndex", 0);
      }
    };

    return AbleInsectTypeListerViewer;

  })(Listener);

  /*
  */


  exports.InitDialog = (function() {
    function InitDialog(elementId) {
      this.jDialog = $("#" + elementId);
    }

    InitDialog.prototype.show = function() {
      this.initValues();
      return this.jDialog.show();
    };

    InitDialog.prototype.close = function() {
      return this.jDialog.hide();
    };

    InitDialog.prototype.initValues = function() {
      var jGrowthPointTextboxs;
      jGrowthPointTextboxs = $("div.dialogBody div.TextArea input:text");
      return jGrowthPointTextboxs.val(0).change();
    };

    return InitDialog;

  })();

  /*
  パラメータ入力ダイアログ建造者
  */


  exports.InitDialogBuilder = (function() {
    function InitDialogBuilder() {
      var insectTypeFactory;
      this.validators = null;
      insectTypeFactory = new InsectTypeFactory();
      this.rootInsectType = insectTypeFactory.createRoot();
    }

    InitDialogBuilder.prototype.initValidaters = function() {
      var _this = this;
      this.validators = [];
      $("div.dialogBody div.TextArea input:text").each(function(i, textbox) {
        return _this.validators.push(new NumberRangeValidViewer("#" + textbox.id, 0, 90));
      });
      return this.validators.push(new NumberSumMaxValidViewer("#frmInitDialog .TextArea input:text", "#lblErrorProvider", 90));
    };

    InitDialogBuilder.prototype.addAbleInsectTypeLister = function() {
      var ableInsectTypeLister, jGrowthPointTextboxs;
      ableInsectTypeLister = new AbleInsectTypeLister(LEVEL_LIMIT_LIST, this.rootInsectType);
      ableInsectTypeLister.addListener(new AbleInsectTypeListerViewer("cmbInsectType"));
      jGrowthPointTextboxs = $("div.dialogBody div.TextArea input:text");
      jGrowthPointTextboxs[0].attribute = ATTR.POWER;
      jGrowthPointTextboxs[1].attribute = ATTR.STAMINA;
      jGrowthPointTextboxs[2].attribute = ATTR.SPEED;
      jGrowthPointTextboxs[3].attribute = ATTR.FIRE;
      jGrowthPointTextboxs[4].attribute = ATTR.WATER;
      jGrowthPointTextboxs[5].attribute = ATTR.THUNDER;
      jGrowthPointTextboxs[6].attribute = ATTR.ICE;
      jGrowthPointTextboxs[7].attribute = ATTR.DRAGON;
      jGrowthPointTextboxs.change(function() {
        return ableInsectTypeLister.setGrowthPoint($(this).prop("attribute"), $(this).val());
      });
      jGrowthPointTextboxs.keyup(function() {
        return ableInsectTypeLister.setGrowthPoint($(this).prop("attribute"), $(this).val());
      });
      return jGrowthPointTextboxs.change();
    };

    InitDialogBuilder.prototype.addRequireValidationButtonViewer = function() {
      return new RequireValidationButtonViewer("btnInitDialogOk", this.validators);
    };

    InitDialogBuilder.prototype.getResult = function() {
      return new InitDialog("initDialog");
    };

    return InitDialogBuilder;

  })();

  /*
  パラメータ入力ダイアログ建築指揮者
  */


  exports.InitDialogBuildDirector = (function() {
    function InitDialogBuildDirector(builder) {
      this.builder = builder;
    }

    InitDialogBuildDirector.prototype.construct = function() {
      this.builder.initValidaters();
      this.builder.addAbleInsectTypeLister();
      this.builder.addRequireValidationButtonViewer();
      return this.builder.getResult();
    };

    return InitDialogBuildDirector;

  })();

}).call(this);
