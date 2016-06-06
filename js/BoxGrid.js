function calculateOffsets(width, height, boxGrid) {
  var offsets = new THREE.InstancedBufferAttribute( new Float32Array( boxGrid.instances * 3 ), 3, 1 );
  var dx = (boxGrid.boxLengthInPixels / width);
  var dy = 1 / boxGrid.rowCount;
  for ( var i = 0, ul = offsets.count; i < ul; i++ ) {
    
    var columnIndex = (i % boxGrid.columnCount)
    var rowIndex    = Math.floor(i / boxGrid.columnCount)
    var distanceFromCenterX = columnIndex - (.5 * boxGrid.columnCount);
    var distanceFromCenterY = rowIndex - (.5 * boxGrid.rowCount);
    
    var distanceScalingFactor = 0.99; //This is just to prevent 1px artefacts between boxes
    var x = distanceScalingFactor * width  * (dx * (distanceFromCenterX + 0.5));
    var y = distanceScalingFactor * height * (dy * (distanceFromCenterY + 0.5));
    var z = ( Math.abs(Math.ceil(distanceFromCenterX)) 
            + Math.abs(Math.ceil(distanceFromCenterY)))
            * -boxGrid.boxLengthInPixels;

    offsets.setXYZ( i, x, y, z );
  }
  
  return offsets;
}

function BoxGrid(width, height) {
  
  this.rowCount = 20;
  this.boxLengthInPixels = height / this.rowCount;
  this.columnCount = Math.ceil(width / this.boxLengthInPixels);

  this.instances = this.rowCount * this.columnCount;
  
  var offsets = calculateOffsets(width, height, this)
  
  var boxGeometry = new THREE.BoxGeometry(
    this.boxLengthInPixels, this.boxLengthInPixels, this.boxLengthInPixels, //Side lengths
    1, 1, 1 //Number of divisions per face (N + 1 tri's result)
  );
  
  this.geometry = new THREE.InstancedBufferGeometry().fromGeometry(boxGeometry);
  
  this.geometry.addAttribute( 'offset', offsets ); // per mesh translation
}