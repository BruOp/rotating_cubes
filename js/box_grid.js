function InstancedBoxGridGeometry(width, height) {
  this.init = function(width, height) {
    this.rowCount = 24;
    this.columnCount = 2 * this.rowCount;
    this.boxLengthInPixels = this.calculateBoxLengthInPixels(width, height);

    this.instances = this.rowCount * this.columnCount;

    var offsets = this.calculateOffsets(width, height)

    var boxGeometry = new THREE.BoxGeometry(
      this.boxLengthInPixels, this.boxLengthInPixels, this.boxLengthInPixels, //Side lengths
      1, 1, 1 //Number of divisions per face (N + 1 tri's result)
    );

    this.geometry = new THREE.InstancedBufferGeometry().fromGeometry(boxGeometry);
    this.geometry.addAttribute( 'offset', offsets ); // per mesh translation
  }

  this.calculateOffsets = function(width, height) {
    var offsets = new THREE.InstancedBufferAttribute( new Float32Array( this.instances * 3 ), 3, 1 );
    var dx = 1 / this.columnCount;
    var dy = 1 / this.rowCount;
    for ( var i = 0, ul = offsets.count; i < ul; i++ ) {

      var columnIndex = (i % this.columnCount)
      var rowIndex    = Math.floor(i / this.columnCount)
      var distanceFromCenterX = columnIndex - (.5 * this.columnCount);
      var distanceFromCenterY = rowIndex - (.5 * this.rowCount);

      var distanceScalingFactor = .99; //This is just to prevent 1px artefacts between boxes
      var x = distanceScalingFactor * (dx * (distanceFromCenterX + 0.5)); //
      var y = distanceScalingFactor * (dy * (distanceFromCenterY + 0.5));
      var z = ( Math.abs(Math.ceil(distanceFromCenterX))
              + Math.abs(Math.ceil(distanceFromCenterY)))
              * -this.boxLengthInPixels;

      offsets.setXYZ( i, x, y, 0 );
    }

    return offsets;
  }

  this.calculateBoxLengthInPixels = function(width, height) {
    return Math.max(
      height / this.rowCount,
      width  / this.columnCount
    );
  }

  this.columnRowRatio = function() {
    return this.columnCount / this.rowCount;
  }

  this.adjustBoxLengths = function(width, height) {
    this.geometry.attributes.position.needsUpdate = true;
    var newBoxLength = this.calculateBoxLengthInPixels(width, height);
    var scalingRatio = newBoxLength / this.boxLengthInPixels;
    var vertices = this.geometry.attributes.position.array;
    for (var i = 0; i < vertices.length; i++) {
      vertices[i] *= scalingRatio;
    }
    this.boxLengthInPixels = newBoxLength;
  }

  this.init(width, height);
}
