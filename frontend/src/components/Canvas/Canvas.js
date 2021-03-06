import React, { useEffect, useState } from 'react';
import styles from './Canvas.module.scss';
import { fabric } from 'fabric';
import Tools from '../Tools/Tools';
import ApiService from '../../Services/ApiService';
import UserList from '../UserList/UserList';
import Loader from '../Loader/Loader';

const MAX_SIZE = process.env.REACT_APP_MAX_SIZE;

function Canvas({ socket }) {
  const [loaded, setLoaded] = useState(false);
  const [canvas, setCanvas] = useState({});
  const [id, setId] = useState('');

  useEffect(() => {
    ApiService.getResource('main-canvas').then((data) => {
      setId(data._id);
      if (data.canvasData) {
        setLoaded(true);
        const importCanvas = initCanvas();
        importCanvas.loadFromJSON(data.canvasData, () => {
          setCanvas(importCanvas);
          importCanvas.renderAll();
        });
      } else {
        setCanvas(initCanvas());
      }
    });
  }, []);

  useEffect(() => {
    socket.on('connection', (data) => setId(data));
    socket.on('saving', (data) => {
      if (Object.keys(canvas).length > 1) {
        canvas.loadFromJSON(JSON.parse(data.data), () => {
          setCanvas(canvas);
          canvas.renderAll();
        });
      }
    });
    document.addEventListener('keyup', handleKeyup, false);
  }, [canvas, socket]);

  const initCanvas = () => {
    return new fabric.Canvas('main-canvas', {
      preserveObjectStacking: true,
      height: window.innerHeight - 200,
      width: window.innerWidth - 500,
      backgroundColor: 'white',
      isDrawingMode: true,
    });
  };

  const saveCanvas = () => {
    setTimeout(() => {
      const canvasData = JSON.stringify(canvas.toJSON());
      if (canvas && canvasData.length < MAX_SIZE) {
        const body = {
          _id: id,
          canvasData,
        };
        ApiService.createResource('canvas', body, 'PUT');
        socket.emit('save', {
          data: canvasData,
          id,
        });
      } else {
        alert('Your canvas is too big!!');
      }
    }, 1);
  };

  const handleKeyup = (e) => {
    if ((e.keyCode === 46 || e.keyCode === 8) && canvas.toJSON) {
      if (canvas.isDrawingMode === false) {
        const activeObjects = canvas.getActiveObjects();
        canvas.discardActiveObject();
        activeObjects.forEach((obj) => canvas.remove(obj));
        saveCanvas();
      }
    }
  };

  return (
    <div className={styles.Canvas} data-testid="Canvas">
      <div className={styles.canvasContainer}>
        {!loaded ? (
          <div className={styles.loader}>
            <Loader />
          </div>
        ) : (
          <div className={styles.canvasWrapper} onMouseUp={saveCanvas} data-testid="wrapper">
            <canvas id="main-canvas" className={styles.canvas}></canvas>
          </div>
        )}
        <div className={styles[!loaded ? 'hidden' : '']}>
          <div className={styles.toolbox}>
            <Tools canvas={canvas} saveCanvas={saveCanvas} />
            <div className="userList">
              <UserList socket={socket} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Canvas;
