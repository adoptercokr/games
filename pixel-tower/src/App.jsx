import React, { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
import './index.css';

const ShapeIcon = ({ shape }) => {
  let path = null;
  switch(shape) {
    case 'square': path = <rect x="11" y="11" width="10" height="10" />; break;
    case 'h-bar': path = <rect x="6" y="11" width="20" height="10" />; break;
    case 'v-bar': path = <rect x="11" y="6" width="10" height="20" />; break;
    case 'long': path = <rect x="1" y="11" width="30" height="10" />; break;
    case 'tall': path = <rect x="11" y="1" width="10" height="30" />; break;
    case 'l-shape': path = <path d="M11,8 h5 v10 h5 v5 h-10 Z" />; break;
    case 'j-shape': path = <path d="M16,8 h5 v15 h-10 v-5 h5 Z" />; break;
    case 't-shape': path = <path d="M8,11 h15 v5 h-5 v5 h-5 v-5 h-5 Z" />; break;
    case 'z-shape': path = <path d="M8,11 h10 v5 h5 v5 h-10 v-5 h-5 Z" />; break;
    case 'u-shape': path = <path d="M8,11 h15 v10 h-5 v-5 h-5 v5 h-5 Z" />; break;
    case 'cross-shape': path = <path d="M13,8 h5 v5 h5 v5 h-5 v5 h-5 v-5 h-5 v-5 h5 Z" />; break;
    case 'long-cross': path = <path d="M13,3 h5 v10 h10 v5 h-10 v10 h-5 v-10 h-10 v-5 h10 Z" />; break;
    default: path = <rect x="11" y="11" width="10" height="10" />; break;
  }
  return (
    <svg width="100%" height="100%" viewBox="0 0 32 32" style={{ fill: 'currentColor' }}>
      {path}
    </svg>
  );
};

const shapesList = [
  { id: 'square', name: '사각' },
  { id: 'h-bar', name: '가로 막대' },
  { id: 'v-bar', name: '세로 막대' },
  { id: 'long', name: '긴 가로' },
  { id: 'tall', name: '긴 세로' },
  { id: 'l-shape', name: 'L 모양' },
  { id: 'j-shape', name: 'J 모양' },
  { id: 't-shape', name: 'T 모양' },
  { id: 'z-shape', name: 'Z 모양' },
  { id: 'u-shape', name: 'ㄷ 모양' },
  { id: 'cross-shape', name: '십자 모양' },
  { id: 'long-cross', name: '긴 십자' },
];

function App() {
  const sceneRef = useRef(null);
  const engineRef = useRef(null);
  const renderRef = useRef(null);
  
  const heightRef = useRef(null);
  const recordRef = useRef(null);
  const clawRef = useRef(null);
  
  const [dropX, setDropX] = useState(0);
  const [canDrop, setCanDrop] = useState(true);
  
  const [blockStyle, setBlockStyle] = useState({
    shape: 'square',
    color: '#3b82f6',
    image: null
  });
  
  const cameraRef = useRef({
    scale: 1,
    x: 0,
    y: 0,
    isDragging: false,
    lastMouseX: 0,
    lastMouseY: 0
  });

  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has('room')) {
      url.searchParams.set('room', Math.random().toString(36).substring(2, 8));
      window.history.replaceState({}, '', url);
    }

    const engine = Matter.Engine.create({
      positionIterations: 30,
      velocityIterations: 20,
      enableSleeping: true 
    });
    engineRef.current = engine;
    
    const render = Matter.Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width: window.innerWidth,
        height: window.innerHeight,
        wireframes: false,
        background: 'transparent',
        hasBounds: true
      }
    });
    renderRef.current = render;

    const floorY = window.innerHeight - 50;

    const floor = Matter.Bodies.rectangle(window.innerWidth / 2, floorY, 4000, 100, { 
      isStatic: true,
      friction: 1,
      render: { fillStyle: '#4a4e69' }
    });
    Matter.Composite.add(engine.world, [floor]);

    Matter.Events.on(render, 'afterRender', () => {
      const ctx = render.context;
      const bounds = render.bounds;
      
      ctx.save();
      const scaleX = render.options.width / (bounds.max.x - bounds.min.x);
      const scaleY = render.options.height / (bounds.max.y - bounds.min.y);
      ctx.scale(scaleX, scaleY);
      ctx.translate(-bounds.min.x, -bounds.min.y);

      const bodies = Matter.Composite.allBodies(engine.world);
      
      bodies.forEach(body => {
        if (body.customRender) {
          const { color, image, w, h } = body.customRender;
          
          ctx.beginPath();
          const partsToRender = body.parts.length > 1 ? body.parts.slice(1) : body.parts;
          
          partsToRender.forEach(part => {
            ctx.moveTo(part.vertices[0].x, part.vertices[0].y);
            for (let j = 1; j < part.vertices.length; j++) {
              ctx.lineTo(part.vertices[j].x, part.vertices[j].y);
            }
            ctx.lineTo(part.vertices[0].x, part.vertices[0].y);
          });
          ctx.closePath();

          if (image && image.domElement) {
            ctx.save();
            ctx.clip(); 
            
            ctx.translate(body.position.x, body.position.y);
            ctx.rotate(body.angle);

            const imgAspect = image.width / image.height;
            const boxAspect = w / h;
            
            let drawW = w;
            let drawH = h;
            let offsetX = -w / 2;
            let offsetY = -h / 2;

            if (imgAspect > boxAspect) {
              drawH = h;
              drawW = h * imgAspect;
              offsetX = -drawW / 2;
            } else {
              drawW = w;
              drawH = w / imgAspect;
              offsetY = -drawH / 2;
            }

            ctx.drawImage(image.domElement, offsetX, offsetY, drawW, drawH);
            ctx.restore();
          } else {
            ctx.fillStyle = color;
            ctx.fill();
          }
        }
      });
      ctx.restore();
    });

    Matter.Runner.run(Matter.Runner.create(), engine);
    Matter.Render.run(render);

    updateCamera();

    let maxRecord = parseFloat(localStorage.getItem('pixelTowerRecord')) || 0;
    if (recordRef.current) recordRef.current.innerText = `${maxRecord.toFixed(1)}m`;

    Matter.Events.on(engine, 'afterUpdate', () => {
      const bodies = Matter.Composite.allBodies(engine.world);
      let highestY = floor.bounds.min.y;
      
      bodies.forEach(body => {
        if (!body.isStatic) {
          if (body.bounds.min.y < highestY) {
            highestY = body.bounds.min.y;
          }
        }
      });

      const pixelsHigh = floor.bounds.min.y - highestY;
      const meters = Math.max(0, pixelsHigh / 80).toFixed(1);
      
      if (heightRef.current) {
        heightRef.current.innerText = `${meters}m`;
      }

      if (parseFloat(meters) > maxRecord) {
        maxRecord = parseFloat(meters);
        localStorage.setItem('pixelTowerRecord', maxRecord);
        if (recordRef.current) {
          recordRef.current.innerText = `${maxRecord.toFixed(1)}m`;
        }
      }
    });

    return () => {
      Matter.Render.stop(render);
      Matter.Engine.clear(engine);
      if (render.canvas) {
        render.canvas.remove();
      }
    };
  }, []);

  const updateCamera = () => {
    const render = renderRef.current;
    if (!render) return;
    
    const cam = cameraRef.current;
    const cw = window.innerWidth;
    const ch = window.innerHeight;
    
    Matter.Render.lookAt(render, {
      min: { x: cam.x, y: cam.y },
      max: { x: cam.x + cw / cam.scale, y: cam.y + ch / cam.scale }
    });

    if (clawRef.current) {
      clawRef.current.style.transform = `translateX(calc(-50% + ${dropX}px)) scale(${cam.scale})`;
    }
  };

  useEffect(() => {
    if (clawRef.current) {
      clawRef.current.style.transform = `translateX(calc(-50% + ${dropX}px)) scale(${cameraRef.current.scale})`;
    }
  }, [dropX]);

  const handleWheel = (e) => {
    if (e.target.closest('button') || e.target.closest('.customizer-panel') || e.target.closest('.ui-layer')) return;

    const cam = cameraRef.current;
    const zoomSensitivity = 0.001;
    let newScale = cam.scale - e.deltaY * zoomSensitivity;
    
    newScale = Math.max(0.1, Math.min(newScale, 3)); 
    
    const oldWidth = window.innerWidth / cam.scale;
    const oldHeight = window.innerHeight / cam.scale;
    const newWidth = window.innerWidth / newScale;
    const newHeight = window.innerHeight / newScale;
    
    cam.x += (oldWidth - newWidth) / 2;
    cam.y += (oldHeight - newHeight) / 2;
    cam.scale = newScale;
    
    updateCamera();
  };

  const handlePointerDown = (e) => {
    if (e.target.closest('button') || e.target.closest('.customizer-panel') || e.target.closest('.ui-layer')) return;
    const cam = cameraRef.current;
    cam.isDragging = true;
    cam.lastMouseX = e.clientX;
    cam.lastMouseY = e.clientY;
  };

  const handlePointerMove = (e) => {
    const cam = cameraRef.current;
    if (!cam.isDragging) return;
    
    const dx = e.clientX - cam.lastMouseX;
    const dy = e.clientY - cam.lastMouseY;
    
    cam.x -= dx / cam.scale;
    cam.y -= dy / cam.scale;
    
    cam.lastMouseX = e.clientX;
    cam.lastMouseY = e.clientY;
    
    updateCamera();
  };

  const handlePointerUp = () => {
    cameraRef.current.isDragging = false;
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setBlockStyle(prev => ({
        ...prev,
        image: { url, width: img.naturalWidth, height: img.naturalHeight, domElement: img }
      }));
    };
    img.src = url;
  };

  const moveClaw = (dir) => {
    setDropX(prev => prev + dir * 60);
  };

  const dropBlock = () => {
    if (!canDrop) return;
    setCanDrop(false);
    setTimeout(() => setCanDrop(true), 400); 

    const engine = engineRef.current;
    const cam = cameraRef.current;
    if (!engine) return;

    let w = 80, h = 80;
    let parts = [];
    
    switch(blockStyle.shape) {
      case 'square': parts = [Matter.Bodies.rectangle(0, 0, 80, 80)]; w = 80; h = 80; break;
      case 'h-bar': parts = [Matter.Bodies.rectangle(0, 0, 160, 80)]; w = 160; h = 80; break;
      case 'v-bar': parts = [Matter.Bodies.rectangle(0, 0, 80, 160)]; w = 80; h = 160; break;
      case 'long': parts = [Matter.Bodies.rectangle(0, 0, 240, 80)]; w = 240; h = 80; break;
      case 'tall': parts = [Matter.Bodies.rectangle(0, 0, 80, 240)]; w = 80; h = 240; break;
      case 'l-shape':
        parts = [
          Matter.Bodies.rectangle(-20, 0, 40, 120),
          Matter.Bodies.rectangle(20, 40, 40, 40)
        ]; w = 80; h = 120; break;
      case 'j-shape':
        parts = [
          Matter.Bodies.rectangle(20, 0, 40, 120),
          Matter.Bodies.rectangle(-20, 40, 40, 40)
        ]; w = 80; h = 120; break;
      case 't-shape':
        parts = [
          Matter.Bodies.rectangle(0, -20, 120, 40),
          Matter.Bodies.rectangle(0, 20, 40, 40)
        ]; w = 120; h = 80; break;
      case 'z-shape':
        parts = [
          Matter.Bodies.rectangle(-20, -20, 80, 40),
          Matter.Bodies.rectangle(20, 20, 80, 40)
        ]; w = 120; h = 80; break;
      case 'u-shape':
        parts = [
          Matter.Bodies.rectangle(0, -20, 120, 40),
          Matter.Bodies.rectangle(-40, 20, 40, 40),
          Matter.Bodies.rectangle(40, 20, 40, 40)
        ]; w = 120; h = 80; break;
      case 'cross-shape':
        parts = [
          Matter.Bodies.rectangle(0, 0, 120, 40),
          Matter.Bodies.rectangle(0, 0, 40, 120)
        ]; w = 120; h = 120; break;
      case 'long-cross':
        parts = [
          Matter.Bodies.rectangle(0, 0, 200, 40),
          Matter.Bodies.rectangle(0, 0, 40, 200)
        ]; w = 200; h = 200; break;
      default: parts = [Matter.Bodies.rectangle(0, 0, 80, 80)]; w = 80; h = 80; break;
    }

    const screenX = (window.innerWidth / 2) + dropX;
    const screenY = 70 + (h / 2); 
    const worldX = cam.x + (screenX / cam.scale);
    const worldY = cam.y + (screenY / cam.scale);

    const block = Matter.Body.create({
      parts: parts,
      friction: 1, 
      restitution: 0, 
      density: 0.1, 
      angularDamping: 0.6, 
      render: { visible: false },
      sleepThreshold: 30 
    });
    
    Matter.Body.setPosition(block, { x: worldX, y: worldY });

    block.customRender = {
      color: blockStyle.color,
      image: blockStyle.image,
      w: w,
      h: h
    };

    Matter.Composite.add(engine.world, [block]);
  };

  const resetGame = () => {
    if(!window.confirm('정말 탑을 모두 지우고 새로 시작하시겠습니까?')) return;
    const engine = engineRef.current;
    const bodies = Matter.Composite.allBodies(engine.world);
    const blocks = bodies.filter(b => !b.isStatic);
    Matter.Composite.remove(engine.world, blocks);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('친구와 함께 접속할 수 있는 링크가 복사되었습니다!');
  };

  let previewW = 80, previewH = 80;
  let clipPath = 'none';

  switch(blockStyle.shape) {
    case 'square': previewW = 80; previewH = 80; break;
    case 'h-bar': previewW = 160; previewH = 80; break;
    case 'v-bar': previewW = 80; previewH = 160; break;
    case 'long': previewW = 240; previewH = 80; break;
    case 'tall': previewW = 80; previewH = 240; break;
    case 'l-shape': 
      previewW = 80; previewH = 120; 
      clipPath = 'polygon(0 0, 50% 0, 50% 66.6%, 100% 66.6%, 100% 100%, 0 100%)'; 
      break;
    case 'j-shape': 
      previewW = 80; previewH = 120; 
      clipPath = 'polygon(50% 0, 100% 0, 100% 100%, 0 100%, 0 66.6%, 50% 66.6%)'; 
      break;
    case 't-shape': 
      previewW = 120; previewH = 80; 
      clipPath = 'polygon(0 0, 100% 0, 100% 50%, 66.6% 50%, 66.6% 100%, 33.3% 100%, 33.3% 50%, 0 50%)'; 
      break;
    case 'z-shape': 
      previewW = 120; previewH = 80; 
      clipPath = 'polygon(0 0, 66.6% 0, 66.6% 50%, 100% 50%, 100% 100%, 33.3% 100%, 33.3% 50%, 0 50%)'; 
      break;
    case 'u-shape': 
      previewW = 120; previewH = 80; 
      clipPath = 'polygon(0 0, 100% 0, 100% 100%, 66.6% 100%, 66.6% 50%, 33.3% 50%, 33.3% 100%, 0 100%)'; 
      break;
    case 'cross-shape': 
      previewW = 120; previewH = 120; 
      clipPath = 'polygon(33.3% 0, 66.6% 0, 66.6% 33.3%, 100% 33.3%, 100% 66.6%, 66.6% 66.6%, 66.6% 100%, 33.3% 100%, 33.3% 66.6%, 0 66.6%, 0 33.3%, 33.3% 33.3%)'; 
      break;
    case 'long-cross': 
      previewW = 200; previewH = 200; 
      clipPath = 'polygon(40% 0, 60% 0, 60% 40%, 100% 40%, 100% 60%, 60% 60%, 60% 100%, 40% 100%, 40% 60%, 0 60%, 0 40%, 40% 40%)'; 
      break;
  }

  return (
    <div 
      className="container"
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <div className="ui-layer pointer-events-auto">
        <h1>Pixel Tower</h1>
        <div className="score-board">
          <p>현재 높이: <span ref={heightRef} className="score-text">0.0m</span></p>
          <p>신기록: <span ref={recordRef} className="score-text text-yellow">0.0m</span></p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
          <button className="action-btn" onClick={resetGame}>🔄 새로 시작</button>
          <button className="action-btn bg-green" onClick={copyLink}>🔗 링크 복사</button>
        </div>
        <div className="help-text-pc" style={{ marginTop: '0.8rem' }}>
          <p>🖱️ 마우스 드래그: 뷰 이동</p>
          <p>🐭 마우스 휠: 확대/축소</p>
        </div>
      </div>
      
      <div className="customizer-panel">
        <h3>블록 설정</h3>
        
        <div className="setting-group">
          <label>도형 모양 선택</label>
          <div className="shape-btns grid-layout">
            {shapesList.map(s => (
              <button 
                key={s.id}
                className={blockStyle.shape === s.id ? 'active' : ''} 
                onClick={() => setBlockStyle(prev => ({...prev, shape: s.id}))}
              >
                <div className="shape-icon-container">
                  <ShapeIcon shape={s.id} />
                </div>
                <span className="shape-label">{s.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="setting-group">
          <label>단색 채우기</label>
          <input 
            type="color" 
            value={blockStyle.color} 
            onChange={e => setBlockStyle(s => ({...s, color: e.target.value, image: null}))} 
          />
        </div>

        <div className="setting-group">
          <label>사진 씌우기</label>
          <input type="file" accept="image/*" onChange={handleImageUpload} />
          {blockStyle.image && (
            <button className="clear-img-btn" onClick={() => setBlockStyle(s => ({...s, image: null}))}>
              사진 효과 제거
            </button>
          )}
        </div>
      </div>

      <div className="claw-controls">
        <button onPointerDown={(e) => { e.stopPropagation(); moveClaw(-1); }} className="claw-btn">⬅️</button>
        <button 
          onPointerDown={(e) => { e.stopPropagation(); dropBlock(); }} 
          className={`claw-btn drop-btn ${!canDrop ? 'opacity-50 cursor-not-allowed' : ''}`}
        >⬇️ DROP</button>
        <button onPointerDown={(e) => { e.stopPropagation(); moveClaw(1); }} className="claw-btn">➡️</button>
      </div>

      <div 
        ref={clawRef}
        className="claw-wrapper"
        style={{ transform: `translateX(calc(-50% + ${dropX}px))` }}
      >
        <div className="claw-line"></div>
        <div className="claw-grip" style={{ width: Math.max(100, previewW + 20) }}></div>
        <div 
          className={`preview-shape-${blockStyle.shape}`}
          style={{
            width: previewW,
            height: previewH,
            backgroundColor: blockStyle.image ? 'transparent' : blockStyle.color,
            backgroundImage: blockStyle.image ? `url(${blockStyle.image.url})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            clipPath: clipPath
          }}
        ></div>
      </div>

      <div ref={sceneRef} className="canvas-container" />
    </div>
  );
}

export default App;
