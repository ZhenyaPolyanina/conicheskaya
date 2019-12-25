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

/*
addMarkAt(10.04 / 180 * Math.PI, 53.54 / 180 * Math.PI, 'Гамбург');
addMarkAt(43.94 / 180 * Math.PI, 56.28 / 180 * Math.PI, 'Нижний Новгород');
addMarkAt(44.51 / 180 * Math.PI, 48.71 / 180 * Math.PI, 'Волгоград');
*/

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
  ctx.font = '15px Arial';
  ctx.fillStyle = '#000';
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
const red = [255, 0, 0, 255];
const getMapColor = (longitude, latitude) => {
  if (!mapImageData) {
    return white;
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
        color = white;
      } else {
        color = getMapColor(longitude, latitude);
      }

      putPixel(x, y, imageData, color);
    }
  }
  return imageData;
};

let drawPlanet = false;
const redraw = () => {
  ctx.clearRect(0, 0, width, height);
  if (drawPlanet && map) {
    ctx.putImageData(map, 0, 0);
  } else {
    lines.forEach(line => {
      drawLine( line.map(projectEquirectangular) );
    });
  }

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

  const imageData = ctx.getImageData(0, 0, width, height);
  ctx.clearRect(0, 0, width, height);
  ctx.putImageData(imageData, 0, -100);

  const coast = [
    {latitude: 47.116623 / 180 * Math.PI, longitude: 51.026532 / 180 * Math.PI},
    {latitude: 46.843689 / 180 * Math.PI, longitude: 52.142414 / 180 * Math.PI},
    {latitude: 46.227719 / 180 * Math.PI, longitude: 53.281371 / 180 * Math.PI},
    {latitude: 45.397448 / 180 * Math.PI, longitude: 51.986222 / 180 * Math.PI},
    {latitude: 43.892946 / 180 * Math.PI, longitude: 51.044532 / 180 * Math.PI},
    {latitude: 40.375084 / 180 * Math.PI, longitude: 52.771334 / 180 * Math.PI},
    {latitude: 37.867496 / 180 * Math.PI, longitude: 53.819556 / 180 * Math.PI},
    {latitude: 36.745190 / 180 * Math.PI, longitude: 51.102553 / 180 * Math.PI},
    {latitude: 41.287562 / 180 * Math.PI, longitude: 49.126104 / 180 * Math.PI},
    {latitude: 44.824951 / 180 * Math.PI, longitude: 47.179915 / 180 * Math.PI},
    {latitude: 46.539727 / 180 * Math.PI, longitude: 49.906239 / 180 * Math.PI},
    {latitude: 47.116623 / 180 * Math.PI, longitude: 51.026532 / 180 * Math.PI},
  ];
  drawLine( coast.map(projectEquirectangular), '#f00' );

  marks.forEach(drawMark);
};

const modeChooser = document.getElementById('modeChooser');
modeChooser.onchange = () => {
  drawPlanet = !drawPlanet;
  redraw();
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

