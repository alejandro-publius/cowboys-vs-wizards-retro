const canvas = document.querySelector("#duel");
const ctx = canvas.getContext("2d", { alpha: false });
const button = document.querySelector("#play");
const status = document.querySelector("#beat");
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
ctx.imageSmoothingEnabled = false;

function loadArt(name) {
  const image = new Image();
  image.src = `./art/${name}.png`;
  return image.decode().then(() => image);
}

const beats = [
  [0, "The Wizard and Sheriff face off."],
  [0.6, "The Wizard casts Singularity."],
  [1.7, "Singularity pulls the Sheriff across the lane."],
  [2.8, "The Sheriff fires back."],
  [3.15, "The shot catches the Wizard."],
  [4.4, "Exchange complete."],
];
const duration = beats.at(-1)[0];
const wizard = { x: 255, y: 71 };
const start = { x: 127, y: 138 };
const end = { x: 192, y: 141 };
const clamp = n => Math.min(1, Math.max(0, n));
const ramp = (time, from, to) => clamp((time - from) / (to - from));

function pixels(x, y, size, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), size, size);
}

function nameplate(label, color, x, y) {
  ctx.save();
  ctx.font = "bold 10px Georgia";
  ctx.textAlign = "center";
  ctx.lineWidth = 2.4;
  ctx.strokeStyle = "#191822";
  ctx.strokeText(label, Math.round(x), y);
  ctx.fillStyle = color;
  ctx.fillText(label, Math.round(x), y);
  ctx.restore();
}

function sprite(image, x, y, flipped, brighten) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(flipped ? -1 : 1, 1);
  ctx.globalAlpha = 0.52;
  ctx.fillStyle = "#292429";
  ctx.fillRect(-15, -2, 31, 3);
  ctx.fillRect(-12, -4, 25, 6);
  ctx.globalAlpha = 1;
  if (brighten) ctx.filter = "brightness(1.75)";
  ctx.drawImage(image, -Math.floor(image.width / 2), -image.height);
  ctx.restore();
}

function singularity(time, x, y) {
  const strength = ramp(time, .6, 1.18) * (1 - ramp(time, 2.4, 2.8));
  if (!strength) return;
  ctx.save();
  ctx.globalAlpha = strength * .66;
  pixels(x - 4, y - 4, 9, "#161229");
  const colors = ["#745494", "#9867c8", "#ce9ff0", "#edd9fc"];
  for (let i = 0; i < 54; i++) {
    const orbit = (i % 18) / 17;
    const arm = Math.floor(i / 18);
    const angle = arm * 2.094 + orbit * 3.5 - time * 6.2;
    const radius = (3 + orbit * 27) * (.45 + .55 * strength);
    pixels(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius * .56,
      orbit > .68 ? 2 : 3, colors[(i + arm) % colors.length]);
  }
  ctx.restore();
}

function revolver(time, art, sheriffX, sheriffY, wizardX, wizardY) {
  if (time < 2.74 || time >= 3.68) return;
  const hand = { x: sheriffX + 6, y: sheriffY - 23 };
  const impact = { x: wizardX - 4, y: wizardY - 23 };
  const aim = Math.atan2(impact.y - hand.y, impact.x - hand.x);
  const origin = { x: hand.x + Math.cos(aim) * 15, y: hand.y + Math.sin(aim) * 15 };
  ctx.save();
  ctx.translate(Math.round(hand.x), Math.round(hand.y));
  ctx.rotate(aim);
  ctx.drawImage(art, -1, -4, 16, 10);
  ctx.restore();
  if (time < 2.84) return;
  if (time < 3.05) {
    pixels(origin.x - 1, origin.y - 2, 5, "#ffd180");
    pixels(origin.x - 2, origin.y, 3, "#fff3c5");
  }
  const progress = ramp(time, 2.89, 3.14);
  for (let i = 0; i < 11; i++) {
    const u = progress - i * .041;
    if (u < 0 || time > 3.24) continue;
    pixels(origin.x + (impact.x - origin.x) * u, origin.y + (impact.y - origin.y) * u,
      i < 3 ? 2 : 1, i < 3 ? "#fff1bb" : "#f0a64e");
  }
  if (time >= 3.12) {
    const fade = ramp(time, 3.12, 3.68);
    ctx.save();
    ctx.globalAlpha = 1 - fade;
    for (let i = 0; i < 9; i++) {
      const angle = i * 2.399;
      pixels(impact.x + Math.cos(angle) * fade * 16, impact.y + Math.sin(angle) * fade * 10,
        i % 3 ? 2 : 3, i % 2 ? "#ffba75" : "#ecd2fa");
    }
    ctx.restore();
  }
}

let frame = null;
try {
  const [arena, sheriffArt, wizardArt, revolverArt] = await Promise.all(
    ["arena", "sheriff", "wizard", "revolver"].map(loadArt),
  );
  function paint(time) {
    ctx.drawImage(arena, 0, 0);
    const slide = ramp(time, 1.6, 2.32);
    const pull = slide * slide * (3 - 2 * slide);
    const recoil = ramp(time, 2.84, 2.96) * (1 - ramp(time, 2.96, 3.31));
    const hit = ramp(time, 3.12, 3.22) * (1 - ramp(time, 3.22, 3.61));
    const sheriffX = start.x + (end.x - start.x) * pull - recoil * 3;
    const sheriffY = start.y + (end.y - start.y) * pull + recoil * 2;
    const wizardX = wizard.x + hit * 3;
    const wizardY = wizard.y - hit * 2;
    singularity(time, 202, 136);
    if (time >= .6 && time < 1.52) {
      const u = ramp(time, .6, 1.52);
      for (let i = 0; i < 8; i++) {
        const trail = u - i * .038;
        if (trail < 0) continue;
        const x = wizard.x - 12 + (214 - wizard.x) * trail;
        const y = wizard.y - 24 + (160 - wizard.y) * trail;
        pixels(x, y, i % 3 ? 2 : 3, i % 2 ? "#deb1fc" : "#a072cb");
      }
    }
    sprite(wizardArt, wizardX, wizardY, false, time >= 3.12 && time < 3.22);
    sprite(sheriffArt, sheriffX, sheriffY, true, false);
    revolver(time, revolverArt, sheriffX, sheriffY, wizardX, wizardY);
    nameplate("Wizard", "#e9c4f5", wizard.x, wizard.y + 13);
    nameplate("Sheriff", "#f5d08d", sheriffX, sheriffY + 13);
  }

  function display(time) {
    paint(time);
    const [, label] = beats.findLast(([when]) => when <= time);
    if (status.textContent !== label) status.textContent = label;
  }

  display(0);
  button.disabled = false;
  button.addEventListener("click", () => {
    if (frame !== null) cancelAnimationFrame(frame);
    const began = performance.now();
    const reducedFrames = [0, .95, 2.36, 3.02, 3.36, duration];
    button.textContent = "Restart exchange";
    display(0);
    function tick(now) {
      const elapsed = Math.min((now - began) / 1000, duration);
      const time = reduceMotion.matches
        ? reducedFrames[beats.findLastIndex(([when]) => when <= elapsed)]
        : elapsed;
      display(time);
      if (elapsed < duration) frame = requestAnimationFrame(tick);
      else {
        frame = null;
        button.textContent = "Replay exchange";
      }
    }
    frame = requestAnimationFrame(tick);
  });
} catch {
  status.textContent = "The duel artwork couldn’t load. Reload to try again.";
}
