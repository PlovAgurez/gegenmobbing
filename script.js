(() => {
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const title = document.getElementById('scene-title');
  const chapter = document.getElementById('chapter-label');
  const chapterCount = document.getElementById('chapter-count');
  const objectiveText = document.getElementById('objective-text');
  const statusText = document.getElementById('status-text');
  const statusPill = document.getElementById('status-pill');
  const progressLabel = document.getElementById('progress-label');
  const toast = document.getElementById('game-toast');
  const startOverlay = document.getElementById('start-overlay');
  const endOverlay = document.getElementById('end-overlay');
  const retryOverlay = document.getElementById('retry-overlay');
  const endingCopy = document.getElementById('ending-copy');
  const W = canvas.width;
  const H = canvas.height;
  const ground = 366;
  const scenes = [
    {
      name: 'Zwischen den Stunden',
      title: 'Viktor Sergej wird im Flur gemobbt.',
      objective: 'Geh zu der Lehrkraft am Ende des Flurs und hilf Viktor Sergej.',
      teacherMessage: 'Du erzählst deiner Lehrkraft, dass Viktor Sergej im Flur wegen Spott und Ausgrenzung gemobbt wird. Sie hört dir zu, bedankt sich, dass du es erzählt hast, und sorgt dafür, dass Viktor sich sicher fühlt.',
      target: 2260,
      worldWidth: 2500,
      background: 'hall',
      obstacles: [
        { x: 410, width: 42, height: 28, kind: 'bag' }, { x: 900, width: 44, height: 32, kind: 'books' },
        { x: 1390, width: 38, height: 31, kind: 'cone' }, { x: 1880, width: 48, height: 35, kind: 'bag' }
      ],
      characters: [{ x: 655, kind: 'peer' }, { x: 1145, kind: 'peer' }, { x: 1635, kind: 'peer' }],
    },
    {
      name: 'Mittagspause',
      title: 'Viktor Sergej wird ausgeschlossen und gedemütigt.',
      objective: 'Geh zur Aufsicht und erzähl, was du gesehen hast.',
      teacherMessage: 'Du erzählst der Aufsicht, dass Viktor Sergej in der Pause ausgeschlossen und angepöbelt wird. Sie kümmert sich darum und hilft, damit sich Viktor in der Mittagspause wieder willkommen fühlt.',
      target: 2260,
      worldWidth: 2500,
      background: 'yard',
      obstacles: [
        { x: 420, width: 38, height: 32, kind: 'cone' }, { x: 910, width: 50, height: 36, kind: 'bag' },
        { x: 1400, width: 45, height: 34, kind: 'books' }, { x: 1890, width: 40, height: 31, kind: 'cone' }
      ],
      characters: [{ x: 665, kind: 'peer' }, { x: 1155, kind: 'peer' }, { x: 1645, kind: 'peer' }],
    },
    {
      name: 'Nach der Schule',
      title: 'Die verletzenden Nachrichten an Viktor Sergej hören nicht auf.',
      objective: 'Geh zu deiner Lehrkraft und erzähl ihr von den Nachrichten.',
      teacherMessage: 'Du zeigst deiner Lehrkraft die verletzenden Nachrichten an Viktor Sergej. Ihr sichert die Beweise, meldet die Nachrichten und überlegt gemeinsam, wie der Kontakt aufhören kann.',
      target: 2260,
      worldWidth: 2500,
      background: 'room',
      obstacles: [
        { x: 410, width: 44, height: 29, kind: 'books' }, { x: 900, width: 40, height: 31, kind: 'bag' },
        { x: 1390, width: 38, height: 30, kind: 'cone' }, { x: 1880, width: 48, height: 36, kind: 'bag' }
      ],
      characters: [{ x: 655, kind: 'peer' }, { x: 1145, kind: 'peer' }, { x: 1635, kind: 'peer' }],
    },
    {
      name: 'Ein Plan für morgen',
      title: 'Viktor Sergej hat jemanden an seiner Seite.',
      objective: 'Geh zu deiner Lehrkraft und plant gemeinsam den morgigen Tag mit Viktor.',
      teacherMessage: 'Deine Lehrkraft erstellt mit dir einen Sicherheitsplan für Viktor Sergej. Ihr besprecht, wohin er gehen kann und welche Erwachsenen ihm helfen, falls es wieder passiert.',
      target: 2260,
      worldWidth: 2500,
      background: 'office',
      obstacles: [
        { x: 410, width: 40, height: 27, kind: 'bag' }, { x: 900, width: 42, height: 32, kind: 'books' },
        { x: 1390, width: 38, height: 30, kind: 'cone' }, { x: 1880, width: 46, height: 34, kind: 'bag' }
      ],
      characters: [{ x: 1150, kind: 'helper' }],
    }
  ];

  const state = {
    sceneIndex: 0,
    playerX: 90,
    cameraX: 0,
    keys: new Set(),
    touch: new Set(),
    started: false,
    talking: false,
    canInteract: false,
    walk: 0,
    direction: 1,
    alertUntil: 0,
    lives: 3,
    jumpHeight: 0,
    jumpVelocity: 0,
    jumpRequested: false,
    jumpedObstacles: new Set(),
    warnedObstacles: new Set(),
    attack: null,
    attackCooldown: 0,
    invulnerableUntil: 0,
    toastTimeout: null,
    lastFrame: 0
  };

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('visible');
    clearTimeout(state.toastTimeout);
    state.toastTimeout = setTimeout(() => toast.classList.remove('visible'), 1800);
  }

  function setStatus(message, active = true) {
    statusText.textContent = message;
    statusPill.classList.toggle('inactive', !active);
  }

  function beginScene(index) {
    state.sceneIndex = index;
    state.playerX = 90;
    state.cameraX = 0;
    state.talking = false;
    state.canInteract = false;
    state.lives = 3;
    state.jumpHeight = 0;
    state.jumpVelocity = 0;
    state.jumpRequested = false;
    state.jumpedObstacles.clear();
    state.warnedObstacles.clear();
    state.attack = null;
    state.attackCooldown = 0;
    state.invulnerableUntil = 0;
    const scene = scenes[index];
    title.textContent = scene.title;
    chapter.textContent = `MOMENT ${index + 1} · ${scene.name.toUpperCase()}`;
    chapterCount.textContent = `0${index + 1} / 04`;
    objectiveText.textContent = scene.objective;
    progressLabel.textContent = `Abschnitt ${index + 1} von ${scenes.length}`;
    setStatus('Finde einen sicheren Ort');
  }

  function startGame() {
    state.started = true;
    startOverlay.classList.add('hidden');
    beginScene(0);
    showToast('Geh nach rechts, um eine erwachsene Vertrauensperson zu finden.');
  }

  function tellTeacher() {
    if (state.talking || !state.canInteract || !retryOverlay.classList.contains('hidden')) return;
    state.talking = true;
    const scene = scenes[state.sceneIndex];
    objectiveText.textContent = scene.teacherMessage;
    setStatus('Die Lehrkraft hilft dir', false);
    showToast(scene.teacherMessage);
    if (state.sceneIndex < scenes.length - 1) {
      const next = state.sceneIndex + 1;
      setTimeout(() => beginScene(next), 1450);
    } else {
      endingCopy.textContent = `${scene.teacherMessage} Du hast es verdient, dich sicher zu fühlen. Du musst Mobbing nicht allein bewältigen.`;
      setTimeout(() => {
        endOverlay.classList.remove('hidden');
        setStatus('Geschichte abgeschlossen', false);
        objectiveText.textContent = 'Du hast es einer Lehrkraft erzählt und ihr habt gemeinsam einen Sicherheitsplan erstellt.';
      }, 1450);
    }
  }

  function roundedRect(x, y, w, h, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();
  }

  function gradientRect(x, y, w, h, top, bottom) {
    const gradient = ctx.createLinearGradient(0, y, 0, y + h);
    gradient.addColorStop(0, top);
    gradient.addColorStop(1, bottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, w, h);
  }

  function line(x1, y1, x2, y2, color, width = 4) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  function drawPerson(x, base, color, pose, scale = 1, helper = false, direction = 1, role = 'student') {
    ctx.save();
    ctx.translate(x, base);
    ctx.scale(scale * direction, scale);

    const ink = '#263849';
    const gait = pose === 'walk' ? state.walk : 0;
    const bob = pose === 'walk' ? Math.abs(Math.sin(gait * 2)) * -2 : 0;
    const stride = pose === 'walk' ? Math.sin(gait) * 9 : 0;
    const armSwing = pose === 'walk' ? Math.sin(gait + Math.PI) * 7 : 0;
    const headY = pose === 'duck' ? -34 : -56 + bob;
    const shoulderY = pose === 'duck' ? -25 : -42 + bob;
    const hipY = pose === 'duck' ? -17 : -16 + bob;

    ctx.fillStyle = 'rgba(25, 38, 45, .2)';
    ctx.beginPath();
    ctx.ellipse(0, -1, 13, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = ink;
    ctx.fillStyle = '#f5f1e8';
    ctx.beginPath();
    ctx.arc(0, headY, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    line(0, headY + 9, 0, hipY, color, 5);

    if (pose === 'windup') {
      line(0, shoulderY, -12, shoulderY - 12, ink, 3.5);
      line(-12, shoulderY - 12, -5, shoulderY - 21, ink, 3.5);
      line(0, shoulderY, 12, shoulderY - 12, ink, 3.5);
      line(12, shoulderY - 12, 19, shoulderY - 22, ink, 3.5);
    } else if (pose === 'punch') {
      line(0, shoulderY, -12, shoulderY + 11, ink, 3.5);
      line(-12, shoulderY + 11, -18, hipY - 2, ink, 3.5);
      line(0, shoulderY, 13, shoulderY + 8, ink, 3.5);
      line(13, shoulderY + 8, 29, shoulderY - 2, ink, 3.5);
    } else if (pose === 'block') {
      line(0, shoulderY, -14, shoulderY - 14, ink, 3.5);
      line(-14, shoulderY - 14, -5, shoulderY - 20, ink, 3.5);
      line(0, shoulderY, 14, shoulderY - 14, ink, 3.5);
      line(14, shoulderY - 14, 5, shoulderY - 20, ink, 3.5);
    } else if (pose === 'duck') {
      line(0, shoulderY, -13, shoulderY + 7, ink, 3.5);
      line(-13, shoulderY + 7, -19, shoulderY + 15, ink, 3.5);
      line(0, shoulderY, 13, shoulderY + 7, ink, 3.5);
      line(13, shoulderY + 7, 19, shoulderY + 15, ink, 3.5);
    } else if (pose === 'walk') {
      line(0, shoulderY, -11 + armSwing, shoulderY + 12, ink, 3.5);
      line(-11 + armSwing, shoulderY + 12, -14 + armSwing, shoulderY + 19, ink, 3.5);
      line(0, shoulderY, 11 - armSwing, shoulderY + 12, ink, 3.5);
      line(11 - armSwing, shoulderY + 12, 14 - armSwing, shoulderY + 19, ink, 3.5);
    } else {
      line(0, shoulderY, -12, shoulderY + 12, ink, 3.5);
      line(-12, shoulderY + 12, -15, shoulderY + 20, ink, 3.5);
      line(0, shoulderY, 12, shoulderY + 12, ink, 3.5);
      line(12, shoulderY + 12, 15, shoulderY + 20, ink, 3.5);
    }

    if (pose === 'duck') {
      line(-3, hipY, -10, -5, ink, 3.5);
      line(-10, -5, -15, -3, ink, 3.5);
      line(3, hipY, 10, -5, ink, 3.5);
      line(10, -5, 15, -3, ink, 3.5);
    } else if (pose === 'walk') {
      line(0, hipY, -5 + stride * .35, -8, ink, 3.5);
      line(-5 + stride * .35, -8, -stride, -1, ink, 3.5);
      line(-stride, -1, -stride - 5, 0, ink, 3.5);
      line(0, hipY, 5 - stride * .35, -8, ink, 3.5);
      line(5 - stride * .35, -8, stride, -1, ink, 3.5);
      line(stride, -1, stride + 5, 0, ink, 3.5);
    } else {
      line(0, hipY, -7, -7, ink, 3.5);
      line(-7, -7, -11, 0, ink, 3.5);
      line(0, hipY, 7, -7, ink, 3.5);
      line(7, -7, 11, 0, ink, 3.5);
    }
    ctx.restore();
  }
  function drawHall(worldWidth) {
    gradientRect(0, 0, worldWidth, 280, '#d6e0df', '#aebfbe');
    gradientRect(0, 280, worldWidth, 160, '#e6ded0', '#c4b8a7');
    gradientRect(0, 270, worldWidth, 12, '#aebdb6', '#81938d');
    for (let x = 0; x < worldWidth; x += 96) {
      ctx.strokeStyle = 'rgba(102, 112, 103, .14)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, 282); ctx.lineTo(x - 30, H); ctx.stroke();
    }
    for (let x = 0; x < worldWidth; x += 120) {
      ctx.strokeStyle = 'rgba(102, 112, 103, .12)';
      ctx.beginPath(); ctx.moveTo(x, 284); ctx.lineTo(x + 25, 440); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,255,255,.2)';
    for (let i = 0; i < worldWidth / 190; i++) {
      ctx.beginPath(); ctx.moveTo(80 + i * 190, 280); ctx.lineTo(190 + i * 190, 440); ctx.lineTo(225 + i * 190, 440); ctx.lineTo(225 + i * 190, 280); ctx.fill();
    }
    let panelIndex = 0;
    for (let x = 26; x < worldWidth - 200; x += 155) {
      ctx.fillStyle = 'rgba(40, 55, 60, .12)';
      ctx.fillRect(x + 5, 194, 112, 3);
      roundedRect(x, 58, 112, 132, 8, panelIndex % 2 ? '#f1f0e5' : '#f5f2e7');
      gradientRect(x + 9, 67, 94, 89, '#b8d2d3', '#809e9d');
      ctx.fillStyle = 'rgba(244, 249, 239, .38)';
      ctx.beginPath(); ctx.moveTo(x + 14, 72); ctx.lineTo(x + 39, 72); ctx.lineTo(x + 20, 148); ctx.lineTo(x + 14, 148); ctx.fill();
      ctx.fillStyle = '#9aaca7'; ctx.fillRect(x + 9, 164, 94, 5);
      ctx.fillStyle = '#99a69e'; ctx.fillRect(x + 30, 211, 52, 25);
      ctx.fillStyle = '#768b82'; ctx.fillRect(x + 26, 235, 60, 6);
      panelIndex += 1;
    }
    for (let x = 75; x < worldWidth - 200; x += 310) {
      roundedRect(x, 14, 165, 12, 4, '#e8e7d8');
      ctx.fillStyle = 'rgba(255, 247, 215, .45)';
      ctx.fillRect(x + 8, 24, 149, 2);
    }
    for (let x = 110; x < worldWidth - 220; x += 465) {
      roundedRect(x, 203, 98, 44, 5, '#d6c6ab');
      roundedRect(x + 8, 210, 82, 30, 3, '#90a9a0');
    ctx.fillStyle = '#476258'; ctx.font = 'bold 9px sans-serif'; ctx.fillText(Math.floor(x / 465) % 2 ? 'SEI NETT' : 'DU ZÄHLST', x + 17, 229);
    }
    const doorX = worldWidth - 185;
    roundedRect(doorX, 123, 112, 151, 8, '#d4ae83');
    roundedRect(doorX + 16, 149, 80, 125, 4, '#53766c');
    ctx.fillStyle = '#dce4d9'; ctx.font = 'bold 12px sans-serif'; ctx.fillText('LEHRERZIMMER', doorX + 14, 141);
    drawSafetyZone(worldWidth - 240, 'LEHRKRAFT');
  }

  function drawYard(worldWidth) {
    gradientRect(0, 0, worldWidth, 250, '#b8d1d6', '#dce4df');
    gradientRect(0, 250, worldWidth, 190, '#8eaa86', '#b9b08e');
    ctx.fillStyle = '#82968b'; ctx.fillRect(0, 236, worldWidth, 18);
    for (let x = 50; x < worldWidth; x += 260) {
      ctx.fillStyle = 'rgba(255,255,255,.2)';
      ctx.beginPath(); ctx.ellipse(x, 73, 32, 13, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x + 22, 72, 23, 16, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x + 43, 75, 29, 11, 0, 0, Math.PI * 2); ctx.fill();
    }
    for (let x = 40, i = 0; x < worldWidth - 150; x += 210, i++) {
      ctx.fillStyle = '#8a6e57'; ctx.fillRect(x - 6, 190, 12, 58);
      ctx.fillStyle = i % 2 ? '#76947b' : '#64856e';
      ctx.beginPath(); ctx.arc(x - 14, 206, 26, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 12, 201, 31, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x, 185, 29, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(108, 139, 119, .55)';
    ctx.lineWidth = 3;
    for (let x = 0; x < worldWidth; x += 170) {
      ctx.beginPath(); ctx.moveTo(x, 302); ctx.quadraticCurveTo(x + 50, 287, x + 100, 302); ctx.stroke();
    }
    for (let x = 150; x < worldWidth - 300; x += 540) {
      roundedRect(x, 278, 166, 12, 4, '#a97e61');
      ctx.fillStyle = '#8f684f'; ctx.fillRect(x + 11, 290, 8, 24); ctx.fillRect(x + 139, 290, 8, 24);
      roundedRect(x + 205, 250, 13, 60, 4, '#75917e');
      ctx.fillStyle = '#f2ead8'; ctx.beginPath(); ctx.arc(x + 211, 242, 25, Math.PI, 0); ctx.fill();
    }
    const shelterX = worldWidth - 330;
    roundedRect(shelterX, 248, 240, 115, 10, '#eadfca');
    ctx.fillStyle = '#97b5a7'; ctx.fillRect(shelterX + 10, 256, 220, 76);
    ctx.fillStyle = '#53766c'; ctx.font = 'bold 12px sans-serif'; ctx.fillText('PAUSENBEREICH', shelterX + 65, 350);
    drawSafetyZone(shelterX + 120, 'SUPERVISOR');
  }

  function drawRoom(worldWidth) {
    gradientRect(0, 0, worldWidth, 274, '#d4dedb', '#aebfbc');
    gradientRect(0, 274, worldWidth, 166, '#d2bda5', '#b39b82');
    for (let x = 0; x < worldWidth; x += 125) {
      ctx.strokeStyle = 'rgba(90, 73, 59, .13)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, 278); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let x = 100; x < worldWidth - 250; x += 430) {
      ctx.fillStyle = 'rgba(40, 55, 60, .16)';
      ctx.fillRect(x + 6, 204, 190, 4);
      roundedRect(x, 50, 190, 150, 10, '#f2eee0');
      gradientRect(x + 10, 60, 170, 128, '#c3dcda', '#829e9d');
      ctx.fillStyle = 'rgba(255,255,255,.35)';
      ctx.beginPath(); ctx.moveTo(x + 18, 68); ctx.lineTo(x + 61, 68); ctx.lineTo(x + 34, 179); ctx.lineTo(x + 18, 179); ctx.fill();
      line(x + 95, 60, x + 95, 188, '#f2eee0', 5);
      line(x + 10, 124, x + 180, 124, '#f2eee0', 5);
      ctx.fillStyle = '#58785f';
      ctx.beginPath(); ctx.arc(x + 34, 193, 13, Math.PI, 0); ctx.fill();
      roundedRect(x + 220, 278, 130, 10, 4, '#8e745d');
      ctx.fillStyle = '#48665e'; ctx.font = 'bold 10px sans-serif'; ctx.fillText('ATME TIEF DURCH', x + 234, 264);
    }
    for (let x = 310; x < worldWidth - 300; x += 610) {
      roundedRect(x, 90, 92, 75, 6, '#f1eadb');
      ctx.fillStyle = '#54766a'; ctx.font = 'bold 9px sans-serif'; ctx.fillText('DU BIST', x + 15, 113); ctx.fillText('NICHT ALLEIN', x + 9, 129);
    }
    const officeX = worldWidth - 330;
    roundedRect(officeX, 190, 250, 116, 10, '#6d8390');
    roundedRect(officeX - 14, 177, 280, 28, 12, '#849aa1');
    roundedRect(officeX + 50, 304, 24, 32, 5, '#ab8366');
    roundedRect(officeX + 190, 304, 24, 32, 5, '#ab8366');
    ctx.fillStyle = '#48665e'; ctx.font = 'bold 12px sans-serif'; ctx.fillText('EIN RUHIGER ORT', officeX + 70, 264);
    drawSafetyZone(officeX + 125, 'LEHRKRAFT');
  }

  function drawOffice(worldWidth) {
    gradientRect(0, 0, worldWidth, 270, '#dce5da', '#b7c8b9');
    gradientRect(0, 270, worldWidth, 170, '#e1d2bd', '#c4ae92');
    for (let x = 0; x < worldWidth; x += 180) {
      ctx.strokeStyle = 'rgba(98, 88, 70, .12)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, 272); ctx.lineTo(x, H); ctx.stroke();
    }
    roundedRect(70, 44, 148, 172, 8, '#f1eee0');
    roundedRect(80, 54, 128, 150, 6, '#bbd6ca');
    ctx.fillStyle = '#728e78';
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(120 + i * 13, 118 + (i % 2) * 20, 12, 0, Math.PI * 2); ctx.fill(); }
    for (let x = 360; x < worldWidth - 430; x += 620) {
      ctx.fillStyle = 'rgba(42, 48, 42, .17)';
      ctx.fillRect(x + 4, 243, 250, 5);
      roundedRect(x, 220, 250, 20, 8, '#9d8064');
      ctx.fillStyle = '#886a52'; ctx.fillRect(x + 20, 240, 14, 95); ctx.fillRect(x + 216, 240, 14, 95);
      roundedRect(x + 76, 190, 110, 28, 8, '#b8c5c6');
      ctx.fillStyle = '#496c63'; ctx.font = 'bold 11px sans-serif'; ctx.fillText('BERATUNG', x + 95, 181);
    }
    const supportX = worldWidth - 360;
    roundedRect(supportX, 62, 166, 122, 8, '#f1eee0');
    ctx.fillStyle = '#668b76'; ctx.fillRect(supportX + 12, 74, 142, 98);
    ctx.fillStyle = '#edf2dd'; ctx.font = 'bold 11px sans-serif'; ctx.fillText('FREUNDLICHKEIT', supportX + 53, 111); ctx.fillText('FÄNGT HIER AN', supportX + 38, 131);
    for (let x = 250; x < worldWidth - 100; x += 360) {
      roundedRect(x, 108, 78, 70, 5, '#8e7359');
      roundedRect(x + 7, 116, 64, 56, 3, '#d6c6ab');
      ctx.fillStyle = '#71927e';
      ctx.beginPath(); ctx.arc(x + 39, 145, 19, Math.PI, 0); ctx.fill();
      ctx.fillRect(x + 35, 145, 8, 20);
    }
    drawSafetyZone(worldWidth - 240, 'LEHRKRAFT');
  }

  function drawSafetyZone(x, label) {
    ctx.save();
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = 'rgba(55, 119, 96, .65)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(x, ground - 3, 55, 12, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#53766c';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, x, ground + 25);
    ctx.textAlign = 'start';
  }

  function drawObstacle(obstacle) {
    const x = obstacle.x;
    const y = ground - obstacle.height;
    if (obstacle.kind === 'bag') {
      roundedRect(x, y + 7, obstacle.width, obstacle.height - 7, 7, '#c98773');
      roundedRect(x + 7, y, obstacle.width - 14, 14, 5, '#d99c80');
      ctx.strokeStyle = '#715c50';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x + obstacle.width / 2, y + 9, 6, Math.PI, 0);
      ctx.stroke();
      line(x + 8, ground - 3, x + 12, ground + 1, '#715c50', 2);
      line(x + obstacle.width - 8, ground - 3, x + obstacle.width - 12, ground + 1, '#715c50', 2);
    } else if (obstacle.kind === 'books') {
      roundedRect(x, y + 18, obstacle.width, 13, 3, '#668b76');
      roundedRect(x + 5, y + 6, obstacle.width - 8, 13, 3, '#d8a85f');
      roundedRect(x + 1, y - 2, obstacle.width - 7, 10, 3, '#7b91a1');
      line(x + 8, y + 8, x + 8, y + 17, '#f2ead8', 2);
    } else {
      ctx.fillStyle = '#d59a55';
      ctx.beginPath();
      ctx.moveTo(x + obstacle.width / 2, y);
      ctx.lineTo(x + obstacle.width, ground);
      ctx.lineTo(x, ground);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#f2ead8';
      ctx.fillRect(x + obstacle.width * .22, y + obstacle.height * .55, obstacle.width * .56, 5);
      ctx.fillStyle = '#849e8a';
      ctx.fillRect(x - 3, ground - 3, obstacle.width + 6, 4);
    }
    ctx.fillStyle = 'rgba(38, 56, 73, .65)';
    ctx.beginPath();
    ctx.ellipse(x + obstacle.width / 2, ground + 2, obstacle.width * .65, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function updateObstacles(scene, dt, now) {
    if (!state.started || state.talking || !retryOverlay.classList.contains('hidden') ||
        !endOverlay.classList.contains('hidden')) return;
    if (state.jumpRequested) {
      if (state.jumpHeight === 0) state.jumpVelocity = 470;
      state.jumpRequested = false;
    }
    if (state.jumpHeight > 0 || state.jumpVelocity > 0) {
      state.jumpHeight += state.jumpVelocity * dt;
      state.jumpVelocity -= 1000 * dt;
      if (state.jumpHeight <= 0) {
        state.jumpHeight = 0;
        state.jumpVelocity = 0;
      }
    }
    for (let i = 0; i < scene.obstacles.length; i++) {
      const obstacle = scene.obstacles[i];
      if (state.direction > 0 && state.playerX < obstacle.x - 220 && state.playerX > obstacle.x - 270 &&
          !state.warnedObstacles.has(i)) {
        state.warnedObstacles.add(i);
        showToast('Hindernis voraus! Geh näher heran und drücke dann W oder ↑ zum Springen.');
      }
      const overlaps = state.playerX + 13 >= obstacle.x && state.playerX - 13 <= obstacle.x + obstacle.width;
      if (overlaps) {
        if (state.jumpHeight >= obstacle.height + 8) {
          if (!state.jumpedObstacles.has(i)) {
            state.jumpedObstacles.add(i);
            showToast('Gut gesprungen! Du hast das Hindernis überwunden.');
          }
        } else {
          state.playerX = state.direction > 0 ? obstacle.x - 14 : obstacle.x + obstacle.width + 14;
          if (now >= state.invulnerableUntil) {
            state.lives -= 1;
            state.invulnerableUntil = now + 1050;
            if (state.lives <= 0) {
              retryOverlay.classList.remove('hidden');
              setStatus('Abschnitt wiederholen', false);
            } else {
              setStatus('Hindernis getroffen – versuch es weiter');
              showToast('Du bist gegen ein Hindernis gestoßen. Spring über das nächste.');
            }
          }
        }
      }
    }
  }

  function drawHitPoints() {
    roundedRect(16, 14, 132, 38, 9, 'rgba(24, 42, 52, .78)');
    ctx.fillStyle = '#f6f1e7';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText('SICHERE SCHRITTE', 27, 29);
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i < state.lives ? '#e87972' : 'rgba(255,255,255,.25)';
      ctx.beginPath();
      const x = 33 + i * 22;
      ctx.moveTo(x, 43);
      ctx.bezierCurveTo(x - 9, 37, x - 6, 31, x, 36);
      ctx.bezierCurveTo(x + 6, 31, x + 9, 37, x, 43);
      ctx.fill();
    }
  }

  function updateThreat(now) {
    if (!state.started || state.talking || !retryOverlay.classList.contains('hidden') ||
        !endOverlay.classList.contains('hidden') || now < state.invulnerableUntil) return;
    const scene = scenes[state.sceneIndex];
    if (state.attack) {
      if (Math.abs(state.playerX - state.attack.attackerX) > 160) {
        state.attack = null;
        state.attackCooldown = now + 450;
        return;
      }
      if (state.attack.phase === 'warning' && now - state.attack.startedAt >= 1000) {
        state.attack.phase = 'strike';
        state.attack.startedAt = now;
        if (state.touch.has('duck') || state.keys.has(' ')) {
          state.attack = null;
          state.attackCooldown = now + 1100;
          showToast('Gut ausgewichen! Geh weiter zur Lehrkraft.');
        } else {
          state.lives -= 1;
          state.playerX = Math.max(34, state.playerX - state.direction * 58);
          state.invulnerableUntil = now + 1300;
          state.attack = null;
          state.attackCooldown = now + 1500;
          if (state.lives <= 0) {
            retryOverlay.classList.remove('hidden');
            setStatus('Abschnitt wiederholen', false);
          } else {
            setStatus('Weiter geht’s – duck dich nächstes Mal');
            showToast('Du wurdest zurückgestoßen. Achte auf die Warnung und halte die Leertaste zum Ducken gedrückt.');
          }
        }
      }
      return;
    }
    if (now < state.attackCooldown) return;
    const attacker = scene.characters.find((character) =>
      character.kind === 'peer' && Math.abs(state.playerX - character.x) < 112
    );
    if (attacker) {
      state.attack = { attackerX: attacker.x, startedAt: now, phase: 'warning' };
      showToast('Achtung, ein Schlag kommt! Halte die Leertaste gedrückt oder geh aus dem Weg.');
    }
  }

  function render(now) {
    const dt = Math.min((now - state.lastFrame) / 1000 || 0, 0.05);
    state.lastFrame = now;
    ctx.clearRect(0, 0, W, H);
    const scene = scenes[state.sceneIndex] || scenes[0];
    state.cameraX = Math.max(0, Math.min(scene.worldWidth - W, state.playerX - W * .4));
    ctx.save();
    ctx.translate(-state.cameraX, 0);
    if (scene.background === 'hall') drawHall(scene.worldWidth);
    else if (scene.background === 'yard') drawYard(scene.worldWidth);
    else if (scene.background === 'room') drawRoom(scene.worldWidth);
    else drawOffice(scene.worldWidth);

    if (state.started && !state.talking && endOverlay.classList.contains('hidden') && retryOverlay.classList.contains('hidden')) {
      const left = state.keys.has('ArrowLeft') || state.keys.has('a') || state.touch.has('left');
      const right = state.keys.has('ArrowRight') || state.keys.has('d') || state.touch.has('right');
      const speed = 190;
      if (left !== right) {
        state.direction = right ? 1 : -1;
        state.playerX += state.direction * speed * dt;
        state.walk += dt * 10;
      }
      state.playerX = Math.max(34, Math.min(scene.target + 25, state.playerX));
      if (state.playerX >= scene.target - 28) {
        state.playerX = scene.target - 28;
        if (!state.canInteract) {
          state.canInteract = true;
          objectiveText.textContent = 'Drücke E, um deiner Lehrkraft zu erzählen, was passiert ist.';
          setStatus('Die Lehrkraft ist da');
          showToast('Du hast deine Lehrkraft erreicht. Drücke E und erzähl, was passiert ist.');
        }
      } else {
        state.canInteract = false;
      }
    }

    updateObstacles(scene, dt, now);
    updateThreat(now);
    scene.obstacles.forEach(drawObstacle);
    scene.characters.forEach((character, i) => {
      let pose = 'idle';
      if (state.attack && character.x === state.attack.attackerX) {
        pose = state.attack.phase === 'warning' ? 'windup' : 'punch';
      }
        const peerColor = character.color || '#a94f4a';
        const role = character.kind === 'peer' ? 'bully' : 'teacher';
        drawPerson(character.x, ground, character.kind === 'helper' ? '#6fa98f' : peerColor, pose,
          character.kind === 'peer' ? .98 : .9, character.kind === 'helper', 1, role);
      });
      drawPerson(scene.target + 25, ground, '#6fa98f', 'idle', .9, true, -1, 'teacher');
    const moving = (state.keys.has('ArrowRight') || state.keys.has('d') || state.touch.has('right')) !==
      (state.keys.has('ArrowLeft') || state.keys.has('a') || state.touch.has('left'));
    const ducking = state.keys.has(' ') || state.touch.has('duck');
    const jumping = state.jumpHeight > 0;
    const playerPose = ducking && !jumping ? 'duck' : (moving && !state.talking ? 'walk' : 'idle');
    ctx.fillStyle = `rgba(38, 56, 73, ${Math.max(.12, .28 - state.jumpHeight / 400)})`;
    ctx.beginPath();
    ctx.ellipse(state.playerX, ground + 1, Math.max(6, 13 - state.jumpHeight / 10), 4, 0, 0, Math.PI * 2);
    ctx.fill();
    if (now < state.invulnerableUntil && Math.floor(now / 100) % 2 === 0) ctx.globalAlpha = .45;
    drawPerson(state.playerX, ground - state.jumpHeight, '#397eaa', playerPose,
      ducking && !jumping ? .76 : 1.02, false, state.direction, 'player');
    ctx.globalAlpha = 1;
    if (state.attack && state.attack.phase === 'warning') {
      ctx.fillStyle = '#9b453f';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!  DUCKEN — LEERTASTE  !', state.playerX, ground - 100);
      ctx.textAlign = 'start';
    }
    if (state.canInteract && !state.talking && retryOverlay.classList.contains('hidden')) {
      ctx.fillStyle = '#254c41';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('E  ·  LEHRKRAFT ANSPRECHEN', state.playerX, ground - 88);
      ctx.textAlign = 'start';
    }
    ctx.restore();
    drawHitPoints();
    roundedRect(16, 58, 190, 8, 4, 'rgba(24, 42, 52, .68)');
    roundedRect(16, 58, 190 * Math.min(1, state.playerX / scene.target), 8, 4, '#9be0c5');
    requestAnimationFrame(render);
  }

  function interact() {
    if (!state.started || state.talking || !retryOverlay.classList.contains('hidden')) return;
    if (state.canInteract) tellTeacher();
    else showToast('Geh weiter zur Lehrkraft. Sie ist da, um dir zu helfen.');
  }

  document.getElementById('start-button').addEventListener('click', startGame);
  document.getElementById('restart-button').addEventListener('click', () => {
    endOverlay.classList.add('hidden');
    state.sceneIndex = 0;
    startGame();
  });
  document.getElementById('retry-button').addEventListener('click', () => {
    retryOverlay.classList.add('hidden');
    beginScene(state.sceneIndex);
    showToast('Du bekommst einen neuen Versuch. Achte auf die Warnung und duck dich mit der Leertaste.');
  });

  document.addEventListener('keydown', (event) => {
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(key)) event.preventDefault();
    if (key === 'e' || key === 'Enter') { if (!event.repeat) interact(); return; }
    if ((key === 'w' || key === 'ArrowUp') && !event.repeat) {
      if (state.started && retryOverlay.classList.contains('hidden') && endOverlay.classList.contains('hidden')) {
        state.jumpRequested = true;
      }
      return;
    }
    state.keys.add(key);
  });
  document.addEventListener('keyup', (event) => {
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    state.keys.delete(key);
  });
  window.addEventListener('blur', () => { state.keys.clear(); state.touch.clear(); });
  document.querySelectorAll('.touch-button').forEach((button) => {
    const key = button.dataset.key;
    const begin = (event) => {
      event.preventDefault();
      if (key === 'interact') interact();
      else if (key === 'jump') state.jumpRequested = true;
      else state.touch.add(key);
    };
    const end = () => state.touch.delete(key);
    button.addEventListener('pointerdown', begin);
    button.addEventListener('pointerup', end);
    button.addEventListener('pointercancel', end);
    button.addEventListener('pointerleave', end);
  });

  beginScene(0);
  requestAnimationFrame(render);
})();
