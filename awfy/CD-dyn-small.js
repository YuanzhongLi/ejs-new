Object.create = function(proto) {
    var ctor = function() {};
    ctor.prototype = proto;
    return new ctor();
};

Function.prototype.call = function(tis) {
    var a = [];
    for (var i = 1; i < arguments.length; i++)
	a[i-1] = arguments[i];
    this.apply(tis, a);
};

Array.prototype.forEach = function(f) {
    for (var i = 0; i < this.length; i++)
	f(this[i]);
}
// This code is derived from the SOM benchmarks, see AUTHORS.md file.
//
// Copyright (c) 2015-2016 Stefan Marr <git@stefan-marr.de>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
'use strict';

function Benchmark() {}

Benchmark.prototype.innerBenchmarkLoop = function (innerIterations) {
  for (var i = 0; i < innerIterations; i++) {
    if (!this.verifyResult(this.benchmark())) {
      return false;
    }
  }
  return true;
};

Benchmark.prototype.benchmark = function () {
  throw "subclass responsibility";
};

Benchmark.prototype.verifyResult = function () {
  throw "subclass responsibility";
};
// This code is derived from the SOM benchmarks, see AUTHORS.md file.
//
// Copyright (c) 2015-2016 Stefan Marr <git@stefan-marr.de>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
'use strict';

var performance = performance || {};
performance.now = (function() {
  return performance.now       ||
         performance.mozNow    ||
         performance.msNow     ||
         performance.oNow      ||
         performance.webkitNow ||
         Date.now;
})();

function Run(benchmarkSuite, name, numIterations, innerIterations) {

  var total = 0;

  function reportBenchmark() {
    print(name + ": iterations=" + numIterations +
      " average: " + Math.round(total / numIterations) + "us total: " + Math.round(total) + "us\n\n");
  }

  function printResult(runTime) {
    print(name + ": iterations=1 runtime: " + Math.round(runTime) + "us\n");
  }

  function measure(bench) {
    var startTime = performance.now();
    if (!bench.innerBenchmarkLoop(innerIterations)) {
      throw "Benchmark failed with incorrect result";
    }
    var diff = performance.now() - startTime;
    var runTime = diff * 1000;

    printResult(runTime);
    total += runTime;
  }

  function doRuns(bench) {
    for (var i = 0; i < numIterations; i++) {
      measure(bench);
    }
  }

  this.printTotal = function () {
    print("Total Runtime: " + total + "us\n");
  };

  this.runBenchmark = function () {
    print("Starting " + name + " benchmark ...\n");

    doRuns(new benchmarkSuite());

    reportBenchmark();
    print("\n");
  };
}


// This code is derived from the SOM benchmarks, see AUTHORS.md file.
//
// Copyright (c) 2015-2016 Stefan Marr <git@stefan-marr.de>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
'use strict';

var INITIAL_SIZE = 10,
  INITIAL_CAPACITY = 16;

function Pair(key, val) {
  this.key   = key;
  this.value = val;
}

function Vector(size) {
  this.storage  = new Array(size === undefined ? 50 : size);
  this.firstIdx = 0;
  this.lastIdx  = 0;
}

Vector.with = function (elem) {
  var v = new Vector(1);
  v.append(elem);
  return v;
};

Vector.prototype.at = function (idx) {
  if (idx >= this.storage.length) {
    return null;
  }
  return this.storage[idx];
};

Vector.prototype.atPut = function (idx, val) {
  if (this.idx >= this.storage.length) {
    var newLength = this.storage.length;
    while (newLength <= idx) {
      newLength *= 2;
    }
    this.storage = this.storage.slice();
    this.storage.length = newLength;
  }
  this.storage[idx] = val;
  if (this.lastIdx < idx + 1) {
    this.lastIdx = idx + 1;
  }
};

Vector.prototype.append = function (elem) {
  if (this.lastIdx >= this.storage.length) {
    // Copy storage to comply with rules, but don't extend storage
    var newLength = this.storage.length * 2;
    this.storage = this.storage.slice();
    this.storage.length = newLength;
  }

  this.storage[this.lastIdx] = elem;
  this.lastIdx += 1;
};

Vector.prototype.isEmpty = function () {
  return this.lastIdx === this.firstIdx;
};

Vector.prototype.forEach = function (fn) {
  for (var i = this.firstIdx; i < this.lastIdx; i++) {
    fn(this.storage[i]);
  }
};

Vector.prototype.hasSome = function(fn) {
  for (var i = this.firstIdx; i < this.lastIdx; i++) {
    if (fn(this.storage[i])) {
      return true;
    }
  }
  return false;
};

Vector.prototype.getOne = function (fn) {
  for (var i = this.firstIdx; i < this.lastIdx; i++) {
    var e = this.storage[i];
    if (fn(e)) {
      return e;
    }
  }
  return null;
};

Vector.prototype.removeFirst = function () {
  if (this.isEmpty()) {
    return null;
  }
  this.firstIdx++;
  return this.storage[this.firstIdx - 1];
};

Vector.prototype.remove = function (obj) {
  var newArray = new Array(this.capacity());
  var newLast = 0;
  var found = false;

  this.forEach(function (it) {
    if (it == obj) {
      found = true;
    } else {
      newArray[newLast] = it;
      newLast++;
    }
  });

  this.storage  = newArray;
  this.lastIdx  = newLast;
  this.firstIdx = 0;
  return found;
};

Vector.prototype.removeAll = function () {
  this.firstIdx = 0;
  this.lastIdx = 0;
  this.storage = new Array(this.storage.length);
};

Vector.prototype.size = function () {
  return this.lastIdx - this.firstIdx;
};

Vector.prototype.capacity = function () {
  return this.storage.length;
};

Vector.prototype.sortRange = function (i, j, compare) {
  if (!compare) {
    this.defaultSort(i, j);
  }

  var n = j + 1 - i;
  if (n <= 1) {
    return;
  }

  var di = this.storage[i];
  var dj = this.storage[j];

  if (compare(di, dj)) {
    this.swap(this.storage, i, j);
    var tt = di;
    di = dj;
    dj = tt;
  }

  if (n > 2) {
    var ij = (i + j) / 2;
    var dij = this.storage[ij];

    if (compare(di, dij) <= 0) {
      if (!compare(dij, dj)) {
        this.swap(this.storage, j, ij);
        dij = dj;
      }
    } else {
      this.swap(this.storage, i, ij);
      dij = di;
    }

    if (n > 3) {
      var k = i;
      var l = j - 1;

      while (true) {
        while (k <= l && compare(dij, this.storage[l])) {
          l -= 1;
        }

        k += 1;
        while (k <= l && compare(this.storage[k], dij)) {
          k += 1;
        }

        if (k > l) {
          break;
        }
        this.swap(this.storage, k, l);
      }
      var c = null; // never used
      this.sort(i, l, c);
      this.sort(k, j, c);
    }
  }
};

Vector.prototype.sort = function(compare) {
  if (this.size() > 0) {
    this.sortRange(this.firstIdx, this.lastIdx - 1, compare);
  }
};

function Set(size) {
  this.items = new Vector(size === undefined ? INITIAL_SIZE : size);
}

Set.prototype.size = function () {
  return this.items.size();
};

Set.prototype.forEach = function (fn) {
  this.items.forEach(fn);
};

Set.prototype.hasSome = function (fn) {
  return this.items.hasSome(fn);
};

Set.prototype.getOne = function (fn) {
  return this.items.getOne(fn);
};

Set.prototype.add = function (obj) {
  if (!this.contains(obj)) {
    this.items.append(obj);
  }
};

Set.prototype.contains = function (obj) {
  return this.hasSome(function (e) { return e == obj; } );
};

Set.prototype.removeAll = function () {
  this.items.removeAll();
};

Set.prototype.collect = function (fn) {
  var coll = new Vector();

  this.forEach(function (e) {
    coll.append(fn(e));
  });

  return coll;
};

function IdentitySet(size) {
  Set.call(this, size === undefined ? INITIAL_SIZE : size);
}
IdentitySet.prototype = Object.create(Set.prototype);

IdentitySet.prototype.contains = function (obj) {
  return this.hasSome(function (e) { return e == obj; });
};

function DictEntry(hash, key, value, next) {
  this.hash  = hash;
  this.key   = key;
  this.value = value;
  this.next  = next;
}

DictEntry.prototype.match = function(hash, key) {
  return this.hash == hash && key == this.key;
};

function Dictionary (size) {
  this.buckets = new Array(size === undefined ? INITIAL_CAPACITY : size);
  this.size_ = 0;
}

function hash(key) {
  if (!key) {
    return 0;
  }
  var hash = key.customHash();
  return hash ^ hash >>> 16;
}

Dictionary.prototype.size = function () {
  return this.size_;
};

Dictionary.prototype.isEmpty = function () {
  return this.size_ === 0;
};

Dictionary.prototype.getBucketIdx = function (hash) {
  return (this.buckets.length - 1) & hash;
};

Dictionary.prototype.getBucket = function (hash) {
  return this.buckets[this.getBucketIdx(hash)];
};

Dictionary.prototype.at = function (key) {
  var hash_ = hash(key),
    e = this.getBucket(hash_);

  while (e) {
    if (e.match(hash_, key)) {
      return e.value;
    }
    e = e.next;
  }
  return null;
};

Dictionary.prototype.containsKey = function (key) {
  var hash_ = hash(key),
    e = this.getBucket(hash_);

  while (e) {
    if (e.match(hash_, key)) {
      return true;
    }
    e = e.next;
  }
  return false;
};

Dictionary.prototype.atPut = function (key, value) {
  var hash_ = hash(key),
    i = this.getBucketIdx(hash_),
    current = this.buckets[i];

  if (!current) {
    this.buckets[i] = this.newEntry(key, value, hash_);
    this.size_ += 1;
  } else {
    this.insertBucketEntry(key, value, hash_, current);
  }

  if (this.size_ > this.buckets.length) {
    this.resize();
  }
};

Dictionary.prototype.newEntry = function (key, value, hash) {
  return new DictEntry(hash, key, value, null);
};

Dictionary.prototype.insertBucketEntry = function (key, value, hash, head) {
  var current = head;

  while (true) {
    if (current.match(hash, key)) {
      current.value = value;
      return;
    }
    if (!current.next) {
      this.size_ += 1;
      current.next = this.newEntry(key, value, hash);
      return;
    }
    current = current.next;
  }
};

Dictionary.prototype.resize = function () {
  var oldStorage = this.buckets;
  this.buckets = new Array(oldStorage.length * 2);
  this.transferEntries(oldStorage);
};

Dictionary.prototype.transferEntries = function (oldStorage) {
  for (var i = 0; i < oldStorage.length; ++i) {
    var current = oldStorage[i];
    if (current) {
      oldStorage[i] = null;

      if (!current.next) {
        this.buckets[current.hash & (this.buckets.length - 1)] = current;
      } else {
        this.splitBucket(oldStorage, i, current);
      }
    }
  }
};

Dictionary.prototype.splitBucket = function (oldStorage, i, head) {
  var loHead = null, loTail = null,
    hiHead = null, hiTail = null,
    current = head;

  while (current) {
    if ((current.hash & oldStorage.length) === 0) {
      if (!loTail) {
        loHead = current;
      } else {
        loTail.next = current;
      }
      loTail = current;
    } else {
      if (!hiTail) {
        hiHead = current;
      } else {
        hiTail.next = current;
      }
      hiTail = current;
    }
    current = current.next;
  }

  if (loTail) {
    loTail.next = null;
    this.buckets[i] = loHead;
  }
  if (hiTail) {
    hiTail.next = null;
    this.buckets[i + oldStorage.length] = hiHead;
  }
};

Dictionary.prototype.removeAll = function () {
  this.buckets = new Array(this.buckets.length);
  this.size_ = 0;
};

Dictionary.prototype.getKeys = function () {
  var keys = new Vector(this.size_);
  for (var i = 0; i < this.buckets.length; ++i) {
    var current = this.buckets[i];
    while (current) {
      keys.append(current.key);
      current = current.next;
    }
  }
  return keys;
};

Dictionary.prototype.getValues = function () {
  var values = new Vector(this.size_);
  for (var i = 0; i < this.buckets.length; ++i) {
    var current = this.buckets[i];
    while (current) {
      values.append(current.value);
      current = current.next;
    }
  }
  return values;
};

function DictIdEntry(hash, key, value, next) {
  DictEntry.call(this, hash, key, value, next);
}
DictIdEntry.prototype = Object.create(DictEntry.prototype);

DictIdEntry.prototype.match = function (hash, key) {
  return this.hash == hash && this.key === key;
};

function IdentityDictionary(size) {
  Dictionary.call(this, size === undefined ? INITIAL_CAPACITY : size);
}
IdentityDictionary.prototype = Object.create(Dictionary.prototype);

IdentityDictionary.prototype.newEntry = function (key, value, hash) {
  return new DictIdEntry(hash, key, value, null);
};

function Random() {
  this.seed = 74755;
}

Random.prototype.next = function () {
  this.seed = ((this.seed * 1309) + 13849) & 65535;
  return this.seed;
};

Array.prototype.fill = function (val) {
  var size = this.length;
  for (var i = 0; i < size; i += 1) {
    this[i] = val;
  }
  return this;
}

som = {
  Set: Set,
  IdentitySet: IdentitySet,
  Dictionary: Dictionary,
  IdentityDictionary: IdentityDictionary,
  Vector: Vector,
  Random: Random
}


// Copyright (c) 2001-2010, Purdue University. All rights reserved.
// Copyright (C) 2015 Apple Inc. All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
//  * Redistributions of source code must retain the above copyright
//    notice, this list of conditions and the following disclaimer.
//  * Redistributions in binary form must reproduce the above copyright
//    notice, this list of conditions and the following disclaimer in the
//    documentation and/or other materials provided with the distribution.
//  * Neither the name of the Purdue University nor the
//    names of its contributors may be used to endorse or promote products
//    derived from this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
// ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
// WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
// DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER BE LIABLE FOR ANY
// DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
// (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
// LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
// ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
// SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
"use strict";

function Vector2D(x, y) {
  this.x = x;
  this.y = y;
}

Vector2D.prototype.plus = function (other) {
  return new Vector2D(this.x + other.x,
                      this.y + other.y);
};

Vector2D.prototype.minus = function (other) {
  return new Vector2D(this.x - other.x,
                      this.y - other.y);
};

function compareNumbers(a, b) {
  if (a === b) {
    return 0;
  }
  if (a < b) {
    return -1;
  }
  if (a > b) {
    return 1;
  }

  // We say that NaN is smaller than non-NaN.
  if (a === a) {
    return 1;
  }
  return -1;
}

Vector2D.prototype.compareTo = function (other) {
  var result = compareNumbers(this.x, other.x);
  if (result) {
    return result;
  }
  return compareNumbers(this.y, other.y);
};

function Vector3D(x, y, z) {
  this.x = x;
  this.y = y;
  this.z = z;
}

Vector3D.prototype.plus = function (other) {
  return new Vector3D(this.x + other.x,
    this.y + other.y,
    this.z + other.z);
};

Vector3D.prototype.minus = function (other) {
  return new Vector3D(this.x - other.x,
    this.y - other.y,
    this.z - other.z);
};

Vector3D.prototype.dot = function (other) {
  return this.x * other.x + this.y * other.y + this.z * other.z;
};

Vector3D.prototype.squaredMagnitude = function () {
  return this.dot(this);
};

Vector3D.prototype.magnitude = function () {
  return Math.sqrt(this.squaredMagnitude());
};

Vector3D.prototype.times = function (amount) {
  return new Vector3D(this.x * amount,
    this.y * amount,
    this.z * amount);
};

function RedBlackTree() {
//  this.root = null;
}

RedBlackTree.prototype.put = function (key, value) {
  var insertionResult = this.treeInsert(key, value);
  if (!insertionResult.isNewEntry) {
    return insertionResult.oldValue;
  }
  var x = insertionResult.newNode,
    y = null;

  while (x !== this.root && x.parent.color === "red") {
    if (x.parent === x.parent.parent.left) {
      y = x.parent.parent.right;
      if (y && y.color === "red") {
        // Case 1
        x.parent.color = "black";
        y.color = "black";
        x.parent.parent.color = "red";
        x = x.parent.parent;
      } else {
        if (x === x.parent.right) {
          // Case 2
          x = x.parent;
          this.leftRotate(x);
        }
        // Case 3
        x.parent.color = "black";
        x.parent.parent.color = "red";
        this.rightRotate(x.parent.parent);
      }
    } else {
      // Same as "then" clause with "right" and "left" exchanged.
      y = x.parent.parent.left;
      if (y && y.color === "red") {
        // Case 1
        x.parent.color = "black";
        y.color = "black";
        x.parent.parent.color = "red";
        x = x.parent.parent;
      } else {
        if (x === x.parent.left) {
          // Case 2
          x = x.parent;
          this.rightRotate(x);
        }
        // Case 3
        x.parent.color = "black";
        x.parent.parent.color = "red";
        this.leftRotate(x.parent.parent);
      }
    }
  }

  this.root.color = "black";
  return null;
};

RedBlackTree.prototype.remove = function (key) {
  var z = this.findNode(key);
  if (!z) {
    return null;
  }

  // Y is the node to be unlinked from the tree.
  var y;
  if (!z.left || !z.right) {
    y = z;
  } else {
    y = z.successor();
  }

  // Y is guaranteed to be non-null at this point.
  var x;
  if (y.left) {
    x = y.left;
  } else {
    x = y.right;
  }

  // X is the child of y which might potentially replace y in the tree. X might be null at
  // this point.
  var xParent;
  if (x) {
    x.parent = y.parent;
    xParent = x.parent;
  } else {
    xParent = y.parent;
  }
  if (!y.parent) {
    this.root = x;
  } else {
    if (y === y.parent.left) {
      y.parent.left = x;
    } else {
      y.parent.right = x;
    }
  }

  if (y !== z) {
    if (y.color === "black") {
      this.removeFixup(x, xParent);
    }

    y.parent = z.parent;
    y.color = z.color;
    y.left = z.left;
    y.right = z.right;

    if (z.left) {
      z.left.parent = y;
    }
    if (z.right) {
      z.right.parent = y;
    }
    if (z.parent) {
      if (z.parent.left === z) {
        z.parent.left = y;
      } else {
        z.parent.right = y;
      }
    } else {
      this.root = y;
    }
  } else if (y.color === "black") {
    this.removeFixup(x, xParent);
  }

  return z.value;
};

RedBlackTree.prototype.get = function (key) {
  var node = this.findNode(key);
  if (!node) {
    return null;
  }
  return node.value;
};

function Entry(key, value) {
  this.key   = key;
  this.value = value;
}

RedBlackTree.prototype.forEach = function (callback) {
  if (!this.root) {
    return;
  }
  var current = treeMinimum(this.root);
  while (current) {
    callback(new Entry(current.key, current.value));
    current = current.successor();
  }
};

RedBlackTree.prototype.findNode = function (key) {
  for (var current = this.root; current;) {
    var comparisonResult = key.compareTo(current.key);
    if (!comparisonResult) {
      return current;
    }
    if (comparisonResult < 0) {
      current = current.left;
    } else {
      current = current.right;
    }
  }
  return null;
};

function InsertResult(isNewEntry, newNode, oldValue) {
  if (isNewEntry)
    this.isNewEntry = isNewEntry;
  if (newNode)
    this.newNode    = newNode;
  if (oldValue)
    this.oldValue   = oldValue;
}

RedBlackTree.prototype.treeInsert = function (key, value) {
  var y = null;
  var x = this.root;
  while (x) {
    y = x;
    var comparisonResult = key.compareTo(x.key);
    if (comparisonResult < 0) {
      x = x.left;
    } else if (comparisonResult > 0) {
      x = x.right;
    } else {
      var oldValue = x.value;
      x.value = value;
      return new InsertResult(false, null, oldValue);
    }
  }

  var z = new Node(key, value);
  z.parent = y;
  if (!y) {
    this.root = z;
  } else {
    if (key.compareTo(y.key) < 0) {
      y.left = z;
    } else {
      y.right = z;
    }
  }
  return new InsertResult(true, z, null);
};

RedBlackTree.prototype.leftRotate = function (x) {
  var y = x.right;

  // Turn y's left subtree into x's right subtree.
  x.right = y.left;
  if (y.left) {
    y.left.parent = x;
  }

  // Link x's parent to y.
  y.parent = x.parent;
  if (!x.parent) {
    this.root = y;
  } else {
    if (x == x.parent.left) {
      x.parent.left = y;
    } else {
      x.parent.right = y;
    }
  }

  // Put x on y's left.
  y.left = x;
  x.parent = y;

  return y;
};

RedBlackTree.prototype.rightRotate = function (y) {
  var x = y.left;

  // Turn x's right subtree into y's left subtree.
  y.left = x.right;
  if (x.right) {
    x.right.parent = y;
  }

  // Link y's parent to x;
  x.parent = y.parent;
  if (!y.parent) {
    this.root = x;
  } else {
    if (y == y.parent.left) {
      y.parent.left = x;
    } else {
      y.parent.right = x;
    }
  }

  x.right = y;
  y.parent = x;

  return x;
};

RedBlackTree.prototype.removeFixup = function (x, xParent) {
  var w = null;
  while (x != this.root && (!x || x.color == "black")) {
    if (x == xParent.left) {
      // Note: the text points out that w cannot be null. The reason is not obvious from
      // simply looking at the code; it comes about from the properties of the red-black
      // tree.
      w = xParent.right;
      if (w.color == "red") {
        // Case 1
        w.color = "black";
        xParent.color = "red";
        this.leftRotate(xParent);
        w = xParent.right;
      }
      if ((!w.left || w.left.color == "black") &&
        (!w.right || w.right.color == "black")) {
        // Case 2
        w.color = "red";
        x = xParent;
        xParent = x.parent;
      } else {
        if (!w.right || w.right.color == "black") {
          // Case 3
          w.left.color = "black";
          w.color = "red";
          this.rightRotate(w);
          w = xParent.right;
        }
        // Case 4
        w.color = xParent.color;
        xParent.color = "black";
        if (w.right) {
          w.right.color = "black";
        }
        this.leftRotate(xParent);
        x = this.root;
        xParent = x.parent;
      }
    } else {
      // Same as "then" clause with "right" and "left" exchanged.
      w = xParent.left;
      if (w.color == "red") {
        // Case 1
        w.color = "black";
        xParent.color = "red";
        this.rightRotate(xParent);
        w = xParent.left;
      }
      if ((!w.right || w.right.color == "black") &&
        (!w.left || w.left.color == "black")) {
        // Case 2
        w.color = "red";
        x = xParent;
        xParent = x.parent;
      } else {
        if (!w.left || w.left.color == "black") {
          // Case 3
          w.right.color = "black";
          w.color = "red";
          this.leftRotate(w);
          w = xParent.left;
        }
        // Case 4
        w.color = xParent.color;
        xParent.color = "black";
        if (w.left) {
          w.left.color = "black";
        }
        this.rightRotate(xParent);
        x = this.root;
        xParent = x.parent;
      }
    }
  }
  if (x) {
    x.color = "black";
  }
};

function CallSign(value) {
  this.value = value;
}

CallSign.prototype.compareTo = function (other) {
  return this.value == other.value ? 0 : (this.value < other.value ? -1 : 1);
};

function Collision(aircraftA, aircraftB, position) {
  this.aircraftA = aircraftA;
  this.aircraftB = aircraftB;
  this.position = position;
}

function CollisionDetector() {
  this.state = new RedBlackTree();
}

CollisionDetector.prototype.handleNewFrame = function (frame) {
  var motions = new som.Vector();
  var seen = new RedBlackTree();
  var that = this;
  frame.forEach(function (aircraft) {
    var oldPosition = that.state.put(aircraft.callsign, aircraft.position);
    var newPosition = aircraft.position;
    seen.put(aircraft.callsign, true);

    if (!oldPosition) {
      // Treat newly introduced aircraft as if they were stationary.
      oldPosition = newPosition;
    }
    motions.append(new Motion(aircraft.callsign, oldPosition, newPosition));
  });

  // Remove aircraft that are no longer present.
  var toRemove = new som.Vector();
  this.state.forEach(function(e) {
    if (!seen.get(e.key)) {
      toRemove.append(e.key);
    }
  });

  toRemove.forEach(function (e) { that.state.remove(e); });

  var allReduced = reduceCollisionSet(motions);
  var collisions = new som.Vector();

  allReduced.forEach(function (reduced) {
    for (var i = 0; i < reduced.size(); ++i) {
      var motion1 = reduced.at(i);
      for (var j = i + 1; j < reduced.size(); ++j) {
        var motion2 = reduced.at(j);
        var collision = motion1.findIntersection(motion2);
        if (collision) {
          collisions.append(new Collision(motion1.callsign, motion2.callsign, collision));
        }
      }
    }
  });

  return collisions;
};

var MIN_X = 0,
  MIN_Y = 0,
  MAX_X = 1000,
  MAX_Y = 1000,
  MIN_Z = 0,
  MAX_Z = 10,
  PROXIMITY_RADIUS = 1,
  GOOD_VOXEL_SIZE = PROXIMITY_RADIUS * 2;

function Motion(callsign, posOne, posTwo) {
  this.callsign = callsign;
  this.posOne = posOne;
  this.posTwo = posTwo;
}

Motion.prototype.delta = function () {
  return this.posTwo.minus(this.posOne);
};

Motion.prototype.findIntersection = function (other) {
  var init1 = this.posOne;
  var init2 = other.posOne;
  var vec1 = this.delta();
  var vec2 = other.delta();
  var radius = PROXIMITY_RADIUS;

  // this test is not geometrical 3-d intersection test, it takes the fact that the aircraft move
  // into account ; so it is more like a 4d test
  // (it assumes that both of the aircraft have a constant speed over the tested interval)

  // we thus have two points, each of them moving on its line segment at constant speed ; we are looking
  // for times when the distance between these two points is smaller than r

  // vec1 is vector of aircraft 1
  // vec2 is vector of aircraft 2

  // a = (V2 - V1)^T * (V2 - V1)
  var a = vec2.minus(vec1).squaredMagnitude();

  if (a !== 0) {
    // we are first looking for instances of time when the planes are exactly r from each other
    // at least one plane is moving ; if the planes are moving in parallel, they do not have constant speed

    // if the planes are moving in parallel, then
    //   if the faster starts behind the slower, we can have 2, 1, or 0 solutions
    //   if the faster plane starts in front of the slower, we can have 0 or 1 solutions

    // if the planes are not moving in parallel, then

    // point P1 = I1 + vV1
    // point P2 = I2 + vV2
    //   - looking for v, such that dist(P1,P2) = || P1 - P2 || = r

    // it follows that || P1 - P2 || = sqrt( < P1-P2, P1-P2 > )
    //   0 = -r^2 + < P1 - P2, P1 - P2 >
    //  from properties of dot product
    //   0 = -r^2 + <I1-I2,I1-I2> + v * 2<I1-I2, V1-V2> + v^2 *<V1-V2,V1-V2>
    //   so we calculate a, b, c - and solve the quadratic equation
    //   0 = c + bv + av^2

    // b = 2 * <I1-I2, V1-V2>
    var b = 2 * init1.minus(init2).dot(vec1.minus(vec2));

    // c = -r^2 + (I2 - I1)^T * (I2 - I1)
    var c = -radius * radius + init2.minus(init1).squaredMagnitude();

    var discr = b * b - 4 * a * c;
    if (discr < 0)
      return null;

    var v1 = (-b - Math.sqrt(discr)) / (2 * a);
    var v2 = (-b + Math.sqrt(discr)) / (2 * a);

    if (v1 <= v2 && ((v1 <= 1  &&  1 <= v2) ||
                     (v1 <= 0  &&  0 <= v2) ||
                     (0  <= v1 && v2 <= 1))) {
      // Pick a good "time" at which to report the collision.
      var v;
      if (v1 <= 0) {
        // The collision started before this frame. Report it at the start of the frame.
        v = 0;
      } else {
        // The collision started during this frame. Report it at that moment.
        v = v1;
      }

      var result1 = init1.plus(vec1.times(v));
      var result2 = init2.plus(vec2.times(v));

      var result = result1.plus(result2).times(0.5);
      if (result.x >= MIN_X &&
        result.x <= MAX_X &&
        result.y >= MIN_Y &&
        result.y <= MAX_Y &&
        result.z >= MIN_Z &&
        result.z <= MAX_Z) {
        return result;
      }
    }

    return null;
  }

  // the planes have the same speeds and are moving in parallel (or they are not moving at all)
  // they  thus have the same distance all the time ; we calculate it from the initial point

  // dist = || i2 - i1 || = sqrt(  ( i2 - i1 )^T * ( i2 - i1 ) )
  var dist = init2.minus(init1).magnitude();
  if (dist <= radius) {
    return init1.plus(init2).times(0.5);
  }

  return null;
};

function treeMinimum(x) {
  var current = x;
  while (current.left) {
    current = current.left;
  }
  return current;
}

function Node(key, value) {
  this.key = key;
  this.value = value;
//  this.left = null;
//  this.right = null;
//  this.parent = null;
  this.color = "red";
}

Node.prototype.successor = function () {
  var x = this;
  if (x.right) {
    return treeMinimum(x.right);
  }
  var y = x.parent;
  while (y && x == y.right) {
    x = y;
    y = y.parent;
  }
  return y;
};

var horizontal = new Vector2D(GOOD_VOXEL_SIZE, 0);
var vertical = new Vector2D(0, GOOD_VOXEL_SIZE);

function isInVoxel(voxel, motion) {
  if (voxel.x > MAX_X ||
    voxel.x < MIN_X ||
    voxel.y > MAX_Y ||
    voxel.y < MIN_Y) {
    return false;
  }

  var init = motion.posOne;
  var fin = motion.posTwo;

  var v_s = GOOD_VOXEL_SIZE;
  var r = PROXIMITY_RADIUS / 2;

  var v_x = voxel.x;
  var x0 = init.x;
  var xv = fin.x - init.x;

  var v_y = voxel.y;
  var y0 = init.y;
  var yv = fin.y - init.y;

  var low_x, high_x;
  low_x = (v_x - r - x0) / xv;
  high_x = (v_x + v_s + r - x0) / xv;

  var tmp;

  if (xv < 0) {
    tmp = low_x;
    low_x = high_x;
    high_x = tmp;
  }

  var low_y, high_y;
  low_y = (v_y - r - y0) / yv;
  high_y = (v_y + v_s + r - y0) / yv;

  if (yv < 0) {
    tmp = low_y;
    low_y = high_y;
    high_y = tmp;
  }

  return (((xv === 0 && v_x <= x0 + r && x0 - r <= v_x + v_s) /* no motion in x */ ||
           ((low_x <= 1 && 1 <= high_x) || (low_x <= 0 && 0 <= high_x) ||
            (0 <= low_x && high_x <= 1))) &&
          ((yv === 0 && v_y <= y0 + r && y0 - r <= v_y + v_s) /* no motion in y */ ||
           ((low_y <= 1 && 1 <= high_y) || (low_y <= 0 && 0 <= high_y) ||
            (0 <= low_y && high_y <= 1))) &&
          (xv === 0 || yv === 0 || /* no motion in x or y or both */
           (low_y <= high_x && high_x <= high_y) ||
           (low_y <= low_x && low_x <= high_y) ||
           (low_x <= low_y && high_y <= high_x)));
}

function putIntoMap(voxelMap, voxel, motion) {
  var vec = voxelMap.get(voxel);
  if (!vec) {
    vec = new som.Vector();
    voxelMap.put(voxel, vec);
  }
  vec.append(motion);
}

function voxelHash(position) {
  var xDiv = (position.x / GOOD_VOXEL_SIZE) | 0;
  var yDiv = (position.y / GOOD_VOXEL_SIZE) | 0;

  var result = new Vector2D();
  result.x = GOOD_VOXEL_SIZE * xDiv;
  result.y = GOOD_VOXEL_SIZE * yDiv;

  if (position.x < 0)
    result.x -= GOOD_VOXEL_SIZE;
  if (position.y < 0)
    result.y -= GOOD_VOXEL_SIZE;

  return result;
}

function recurse(voxelMap, seen, nextVoxel, motion) {
  if (!isInVoxel(nextVoxel, motion)) {
    return;
  }
  if (seen.put(nextVoxel, true)) {
    return;
  }

  putIntoMap(voxelMap, nextVoxel, motion);

  recurse(voxelMap, seen, nextVoxel.minus(horizontal), motion);
  recurse(voxelMap, seen, nextVoxel.plus(horizontal), motion);
  recurse(voxelMap, seen, nextVoxel.minus(vertical), motion);
  recurse(voxelMap, seen, nextVoxel.plus(vertical), motion);
  recurse(voxelMap, seen, nextVoxel.minus(horizontal).minus(vertical), motion);
  recurse(voxelMap, seen, nextVoxel.minus(horizontal).plus(vertical), motion);
  recurse(voxelMap, seen, nextVoxel.plus(horizontal).minus(vertical), motion);
  recurse(voxelMap, seen, nextVoxel.plus(horizontal).plus(vertical), motion);
}

function drawMotionOnVoxelMap(voxelMap, motion) {
  var seen = new RedBlackTree();
  recurse(voxelMap, seen, voxelHash(motion.posOne), motion);
}

function reduceCollisionSet(motions) {
  var voxelMap = new RedBlackTree();
  motions.forEach(function (motion) {
    drawMotionOnVoxelMap(voxelMap, motion);
  });

  var result = new som.Vector();
  voxelMap.forEach(function (e) {
    if (e.value.size() > 1) {
      result.append(e.value);
    }
  });
  return result;
}

function Aircraft(callsign, position) {
  this.callsign = callsign;
  this.position = position;
}

function Simulator(numAircraft) {
  this.aircraft = new som.Vector();
  for (var i = 0; i < numAircraft; ++i) {
    this.aircraft.append(new CallSign(i));
  }
}

Simulator.prototype.simulate = function (time) {
  var frame = new som.Vector();
  for (var i = 0; i < this.aircraft.size(); i += 2) {
    frame.append(new Aircraft(this.aircraft.at(i),
        new Vector3D(time, Math.cos(time) * 2 + i * 3, 10)));
    frame.append(new Aircraft(this.aircraft.at(i + 1),
        new Vector3D(time, Math.sin(time) * 2 + i * 3, 10)));
  }
  return frame;
};

function CD() {
  Benchmark.call(this);

  function cd(numAircrafts) {
    var numFrames = 200;
    var simulator = new Simulator(numAircrafts);
    var detector = new CollisionDetector();

    var actualCollisions = 0;
    for (var i = 0; i < numFrames; ++i) {
      var time = i / 10;

      var collisions = detector.handleNewFrame(simulator.simulate(time));
      actualCollisions += collisions.size();
    }
    return actualCollisions;
  }

  function verifyResult(actualCollisions, numAircrafts) {
    if (numAircrafts == 1000) { return actualCollisions == 14484; }
    if (numAircrafts ==  500) { return actualCollisions == 14484; }
    if (numAircrafts ==  250) { return actualCollisions == 10830; }
    if (numAircrafts ==  200) { return actualCollisions ==  8655; }
    if (numAircrafts ==  100) { return actualCollisions ==  4305; }
    if (numAircrafts ==   10) { return actualCollisions ==   390; }

    process.stdout.write("No verification result for " + numAircrafts + " found");
    process.stdout.write("Result is: " + actualCollisions);
    return false;
  }

  this.innerBenchmarkLoop = function (innerIterations) {
    return verifyResult(cd(innerIterations), innerIterations);
  };
}

var run = new Run(CD, "CD", 1, 250);
run.runBenchmark();
run.printTotal();

