var assert = require("assert");
var Rules = require("../lib/Rules");


describe("Rules", function() {
  it("populates multiple outcomes", function() {
    var config = {
      "Must be 21 or older": {
        if: {
          "person.age": {
            lessThan: 21
          }
        },
        then: {
          "person.error": "Must be 21 or older",
          "errors.all[]": "person"
        }
      },
      "Must be employed": {
        if: {
          "company.isEmployed": false
        },
        then: {
          "company.error": "Must be employed",
          "errors.all[]": "company"
        }
      }
    };
    var data = {
      person: {
        age: 20
      },
      company: {
        isEmployed: false
      }
    };

    var rules = new Rules(config);
    var results = rules.run(data);
    assert.equal(results.person.error, "Must be 21 or older");
    assert.deepEqual(results.errors.all, ["person", "company"]);
  });

  it("populates multiple outcomes into an array when [] is added", function() {
    var config = {
      "Must be 21 or older": {
        if: {
          "person.age": { lessThan: 21}
        },
        then: {
          "errors[]": "Must be 21 or older"
        }
      },
      "Must be employed": {
        if: {
          "person.isCitizen": false
        },
        then: {
          "errors[]": "Must be a citizen"
        }
      }
    };
    var data = {
      person: {
        age: 20,
        isCitizen: false,
      }
    };
    var rules = new Rules(config);
    var results = rules.run(data);

    assert.deepEqual(results.errors, [
      "Must be 21 or older",
      "Must be a citizen"
    ]);
  });

  it("doesn't throw path errors with strict:false", function() {
    var config = {
      "name must be set": {
        if: {
          "person.name": { not: undefined }
        },
        then: {
          "errors[]": "Must have a name"
        },
      },
    };

    var data = {
      person: {
        age: 34
      },
    };
    var rules = new Rules(config);
    assert.doesNotThrow(function() {
      rules.run(data);
    }, "should not throw path errors with strict:false");
  });

  it("throws path errors with strict:true", function() {
    var config = {
      "name must be set": {
        if: {
          "person.name": { not: undefined }
        },
        then: {
          "errors[]": "Must have a name"
        },
      },
    };

    var data = {
      person: {
        age: 34
      },
    };
    var rules = new Rules(config, {strict: true});
    assert.throws(function() {
      rules.run(data);
    }, "should throw path errors with strict:false");
  });
});

describe("options", function() {
  it("stringNumbers: false prevents parsing of numbers", function() {
    var data = {age: "14"};

    var config = {
      "Younger than 16 can't drive": {
        if: {
          "age": { lessThan: 16}
        },
        then: {
          "canDrive": false
        }
      }
    };

    var rules = new Rules(config, {stringNumbers: false});
    var error;
    try {
      rules.run(data);
    } catch(e) {
      error = true;
    }

    assert(error);
  });

  it("rulesModifyData: false creates new object of rule outcomes", function() {
    var data = {age: 15};

    var config = {
      "Younger than 16 can't drive": {
        if: {
          "age": { lessThan: 16}
        },
        then: {
          "cantDrive": true
        }
      }
    };

    var rules = new Rules(config, {rulesModifyData: false});
    var results = rules.run(data);

    assert.equal(results.cantDrive, true);
    assert.equal(data.cantDrive, undefined);
  });

  it("rulesModifyData: true modifies data with outcomes", function() {
    var data = {age: 15};

    var config = {
      "Younger than 16 can't drive": {
        if: {
          "age": { lessThan: 16}
        },
        then: {
          "cantDrive": true
        }
      }
    };

    var rules = new Rules(config, {rulesModifyData: true});
    rules.run(data);

    assert.equal(data.cantDrive, true);
  });

  it("caseSensitive: false ignores case on contains", function() {
    var data = {
      person: { jobDescription: "Nursing management and oversight" }
    };

    var config = {
      "Anything to do with nursing is a good thing": {
        if: {
          "person.jobDescription": { contains: "nursing" }
        },
        then: { "status.hasGoodJob": true }
      }
    };

    var rules = new Rules(config, {caseSensitive: false});
    var results = rules.run(data);

    assert.equal(results.status.hasGoodJob, true);
  });

  it("caseSensitive: false ignores case on equality", function() {
    var data = {
      name: "John"
    };

    var config = {
      "John is a great name": {
        if: {
          "name": "john"
        },
        then: { "status.hasGreatName": true }
      }
    };

    var rules = new Rules(config, {caseSensitive: false});
    var results = rules.run(data);

    assert.equal(results.status.hasGreatName, true);
  });
});
