document.body.oncontextmenu = event => event.preventDefault();
const canvas = document.getElementById('canvas');

const ctx = canvas.getContext('2d');

const getWindowDimensions = () => {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
};

const fitCanvas = dimensions => {
  canvas.setAttribute('width', dimensions.width);
  canvas.setAttribute('height', dimensions.height);
};

const lerp = (k, a, b) => {
  return k * (b - a) + a;
}

const getParallel = (latitudeDeg) => {
	const lineLength = 90 - Math.abs(latitudeDeg);
  const line = [];
  for (let i = 0; i <= lineLength; i += 1) {
  	line.push({
    	latitude: latitudeDeg / 180 * Math.PI,
      longitude: lerp(i / lineLength, 0, 60) / 180 * Math.PI,
    });
  }

  return line;
};

const getMeridian = (longitudeDeg) => {
  const line = [];
  for (let i = -90; i <= 39; i += 5) {
  	line.push({
    	latitude: (i / 90) * Math.PI,
      longitude: longitudeDeg / 180 * Math.PI,
    });
  }

  return line;
};

const lines = [];

const precision = 10;
for (let i = -89; i <= 71; i += precision) {
	lines.push( getParallel(i) );
}
for (let i = 0; i <= 60; i += precision) {
	lines.push( getMeridian(i) );
}

const earthRadius = 6371007;
const {width, height} = getWindowDimensions();
const scale = height / 9000000; // px per meter

const centralMeridian = 30 / 180 * Math.PI;
const leftMeridian = 0 / 180 * Math.PI;
const lowestLatitude = 30 / 180 * Math.PI;

const yc = scale * earthRadius * (Math.PI / 2 - lowestLatitude);
const a = Math.atan(width / (2 * yc));

const projectEquirectangular = ({latitude, longitude}) => {
  const b = (
    a * (longitude - centralMeridian) / (centralMeridian - leftMeridian)
  );
  const r = (
    yc * (Math.PI / 2 - latitude) / (Math.PI / 2 - lowestLatitude)
  );

  const x = width / 2 + r * Math.sin(b);
  const y = height - yc + r * Math.cos(b);

  return { x, y };
};

const deprojectEquirectangular = ({x: xIn, y}) => {
  const x = (xIn === width / 2) ? xIn + 0.1 : xIn;

  const b = Math.atan((x - width / 2) / (y + yc - height));
  const r = (x - width / 2) / Math.sin(b);

  const longitude = b / a * (centralMeridian - leftMeridian) + centralMeridian;
  const latitude = Math.PI / 2 - r / yc * (Math.PI / 2 - lowestLatitude);
  return { latitude, longitude };
};

const marks = [];
const addMarkAt = (longitude, latitude, text) => {
  const {x, y} = projectEquirectangular({longitude, latitude});
  marks.push({x, y, longitude, latitude, text});
};



canvas.onclick = (event) => {
  const position = {x: event.offsetX, y: event.offsetY};
  const deprojectedPosition = deprojectEquirectangular(position);
  //addMarkAt(deprojectedPosition.longitude, deprojectedPosition.latitude);

  redraw();
};

const drawLine = (line, color) => {
  ctx.beginPath();
  const startPoint = line[0];
  ctx.moveTo(startPoint.x, startPoint.y);
  line.forEach( point => ctx.lineTo(point.x, point.y) );
  ctx.strokeStyle = color ? color : '#000';
  ctx.stroke();
};

const drawCircle = ({x, y}) => {
  ctx.beginPath();
  const radius = 5;
  ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
  ctx.fillStyle = '#000';
  ctx.fill();
};
/*
const points = [
  { longitude: 0, latitude: 0 },
  { longitude: 30, latitude: 0 },
  { longitude: 60, latitude: 0 },
];

points.forEach(point => {
  const pointRadians = {
    longitude: point.longitude / 180 * Math.PI,
    latitude: point.latitude / 180 * Math.PI,
  };
  const pointScreenCoords = projectEquirectangular(point);
  console.log(pointRadians, pointScreenCoords);
  drawCircle(pointScreenCoords);
});
*/

const drawText = ({x, y}, text) => {
  console.log(x, y);
  ctx.font = '20px Arial';
  ctx.fillStyle = '#fff';
  ctx.fillText(text, x, y);
};

const drawMark = mark => {
  drawCircle(mark);
  if (mark.text) {
    drawText(mark, mark.text);
  } else {
    //drawText();
  }
};

const putPixel = (x, y, imageData, color) => {
  if (x < 0 || x > imageData.width || y < 0 || y > imageData.height) {
    return;
  }

  const index = 4 * (y * imageData.width + x);
  imageData.data[index + 0] = color[0];
  imageData.data[index + 1] = color[1];
  imageData.data[index + 2] = color[2];
  imageData.data[index + 3] = color[3];
};

const getPixel = (x, y, imageData) => {
  if (x < 0 || x > imageData.width || y < 0 || y > imageData.height) {
    return;
  }

  const index = 4 * (y * imageData.width + x);
  const result = [];
  result.push(imageData.data[index + 0]);
  result.push(imageData.data[index + 1]);
  result.push(imageData.data[index + 2]);
  result.push(imageData.data[index + 3]);
  return result;
};

let mapImageData;
let map;

const mapImageSource = document.getElementById('mapImage');

const white = [255, 255, 255, 255];
const black = [0, 0, 0, 255];
const red = [255, 0, 0, 255];
const getMapColor = (longitude, latitude) => {
  if (!mapImageData) {
    return black;
  }

  const normalizedLongitude = (longitude + 180) / 360;
  const normalizedLatitude = (latitude + 90) / 180;
  const x = normalizedLongitude * mapImageData.width;
  const y = mapImageData.height - normalizedLatitude * mapImageData.height;

  return getPixel(Math.round(x), Math.round(y), mapImageData);
};

const createMap = (imageData) => {
  for (let x = 0; x < imageData.width; x++) {
    for (let y = 0; y < imageData.height; y++) {
      const deprojectedPosition = deprojectEquirectangular({x, y});
      const latitude = deprojectedPosition.latitude / Math.PI * 180;
      const longitude = deprojectedPosition.longitude / Math.PI * 180;

      let color;
      if (longitude < 0 || longitude > 60 || latitude > 70) {
        color = black;
      } else {
        color = getMapColor(longitude, latitude);
      }

      putPixel(x, y, imageData, color);
    }
  }
  return imageData;
};

const redraw = () => {
  ctx.clearRect(0, 0, width, height);
  if (map) {
    ctx.putImageData(map, 0, 0);
  }

  lines.forEach(line => {
    drawLine( line.map(projectEquirectangular), '#fff' );
  });

  for (let i = 0; i <= 60; i += 10) {
    drawText( projectEquirectangular({
      longitude: i / 180 * Math.PI,
      latitude: 70 / 180 * Math.PI,
    }), i + '*');
  }
  for (let i = 0; i <= 60; i += 10) {
    drawText( projectEquirectangular({
      longitude: 0 / 180 * Math.PI,
      latitude: i / 180 * Math.PI,
    }), i + '*');
  }

  const coast = [
    {latitude: 47.116623 / 180 * Math.PI, longitude: 51.026532 / 180 * Math.PI},
    {latitude: 46.005694 / 180 * Math.PI, longitude: 51.026532 / 180 * Math.PI},
    {latitude: 45.542965 / 180 * Math.PI, longitude: 53.615691 / 180 * Math.PI},
    {latitude: 45.809938 / 180 * Math.PI, longitude: 54.175193 / 180 * Math.PI},
    {latitude: 45.250693 / 180 * Math.PI, longitude: 54.471314 / 180 * Math.PI},
    //{latitude: 45.335705 / 180 * Math.PI, longitude: 45.335705 / 180 * Math.PI},
    {latitude: 44.581921 / 180 * Math.PI, longitude: 50.738339 / 180 * Math.PI},
    {latitude: 42.455213 / 180 * Math.PI, longitude: 52.627102 / 180 * Math.PI},
    {latitude:  41.270015/ 180 * Math.PI, longitude: 54.486656 / 180 * Math.PI},
    {latitude: 40.436145 / 180 * Math.PI, longitude: 52.765181 / 180 * Math.PI},
    {latitude: 39.247042 / 180 * Math.PI, longitude: 53.602681 / 180 * Math.PI},
    {latitude: 37.528697 / 180 * Math.PI, longitude: 53.895846 / 180 * Math.PI},
    {latitude: 36.559983 / 180 * Math.PI, longitude: 51.914280 / 180 * Math.PI},
    {latitude: 38.199429 / 180 * Math.PI, longitude: 48.910991 / 180 * Math.PI},
    {latitude: 40.330972 / 180 * Math.PI, longitude: 49.775138 / 180 * Math.PI},
    {latitude: 41.930070 / 180 * Math.PI, longitude: 48.438206 / 180 * Math.PI},
    {latitude: 44.488165 / 180 * Math.PI, longitude: 47.038340 / 180 * Math.PI},
    {latitude: 46.194292 / 180 * Math.PI, longitude: 49.240681 / 180 * Math.PI},    
    {latitude: 47.116623 / 180 * Math.PI, longitude: 51.026532 / 180 * Math.PI},
  ];
  drawLine( coast.map(projectEquirectangular), '#f00' );

  marks.forEach(drawMark);
};

mapImageSource.onload = () => {
  fitCanvas(mapImageSource);
  ctx.drawImage(mapImageSource, 0, 0);
  mapImageData = ctx.getImageData(
    0,
    0,
    mapImageSource.width,
    mapImageSource.height
  );

  const imageData = ctx.createImageData(width, height);
  map = createMap(imageData);

  redraw();
};

window.onresize = () => {
  fitCanvas(getWindowDimensions());
  redraw();
};
fitCanvas(getWindowDimensions());
redraw();
