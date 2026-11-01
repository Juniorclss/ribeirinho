/**
 * TELA DE TÍTULO 3D EM TEMPO REAL (THREE.JS PBR) — AMAZÔNIA: CHAMADO RIBEIRINHO ACREANO
 * - Diorama 3D vivo do Rio Juruá, trapiche de madeira, canoa ribeirinha, roçado e floresta amazônica.
 * - Zero telas de texto estáticas: ao iniciar um Novo Jogo ou clicar em "Encenar Chegada 3D",
 *   a história e a chegada do ônibus são encenadas fisicamente dentro do motor 3D In-Game!
 */

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  WORLD_TILE_SIZE,
  animateCharacter3D,
  buildBuilding3DGroup,
  buildBus3DGroup,
  buildCanoe3DGroup,
  buildCharacter3DGroup,
  buildTerrain3DGroup,
  buildTree3DGroup,
  createStudioEnvironment,
  detectSoftwareWebGL,
  populateFarmPlot3DGroup
} from '../game/threeWorldEngine';
import { MAPS_DATA } from '../data/maps';

interface TitleScreenProps {
  hasSavedGame: boolean;
  onStartNewGame: (withInGameIntro?: boolean) => void;
  onContinueGame: () => void;
  onOpenLoadModal: () => void;
  onOpenArtSampleModal: () => void;
  onOpenOptionsModal: () => void;
  onOpenCreditsModal: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  hasSavedGame,
  onStartNewGame,
  onContinueGame,
  onOpenLoadModal,
  onOpenOptionsModal,
  onOpenCreditsModal
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareWebGL();
    const castShadows = !isSoftwareGl;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = castShadows;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const rect = container.getBoundingClientRect();
    const w = Math.max(320, Math.floor(rect.width || window.innerWidth));
    const h = Math.max(240, Math.floor(rect.height || window.innerHeight));
    renderer.setSize(w, h);
    renderer.domElement.className = 'block w-full h-full object-cover';
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x7ec4f2);
    scene.fog = new THREE.FogExp2(0xbfe3b4, 0.008);
    scene.environment = createStudioEnvironment(renderer);

    const camera = new THREE.PerspectiveCamera(38, w / h, 0.5, 160);

    const hemiLight = new THREE.HemisphereLight(0xfff4d6, 0x3b6e28, 1.05);
    hemiLight.position.set(0, 30, 0);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfff0c2, 2.0);
    sunLight.position.set(16, 22, 24);
    sunLight.castShadow = castShadows;
    scene.add(sunLight);

    // Diorama 3D do Sítio Boa Esperança às margens do Rio Juruá
    const farmMap = MAPS_DATA.fazenda;
    const { group: terrainGroup, waterMeshes } = buildTerrain3DGroup(
      farmMap.tiles,
      farmMap.width,
      farmMap.height,
      castShadows
    );
    scene.add(terrainGroup);

    for (const b of farmMap.buildings) {
      const bGrp = buildBuilding3DGroup(b, castShadows);
      const cx = (b.x + (b.width - 1) * 0.5) * WORLD_TILE_SIZE;
      const cz = (b.y + (b.height - 1) * 0.5) * WORLD_TILE_SIZE;
      bGrp.position.set(cx, 0, cz);
      scene.add(bGrp);
    }

    for (const dt of farmMap.decorativeTrees) {
      if (dt.x < 4.5 && dt.y >= 6) continue; // Mantém a área esquerda livre para o menu principal
      const tree = buildTree3DGroup(dt.kind, castShadows);
      tree.position.set(dt.x * WORLD_TILE_SIZE, 0, dt.y * WORLD_TILE_SIZE);
      scene.add(tree);
    }

    // Canteiros demonstrativos 3D à direita dos personagens (totalmente visíveis fora do menu)
    for (let x = 7; x <= 9; x++) {
      for (let y = 7; y <= 10; y++) {
        const pGrp = new THREE.Group();
        pGrp.position.set(x * WORLD_TILE_SIZE, 0, y * WORLD_TILE_SIZE);
        populateFarmPlot3DGroup(
          pGrp,
          true,
          (x + y) % 2 === 0,
          'mandioca',
          ((x + y) % 5) as 0 | 1 | 2 | 3 | 4,
          castShadows
        );
        scene.add(pGrp);
      }
    }

    const hero3D = buildCharacter3DGroup('#285985', '#f2c138', '#361e10', 'Cauã', castShadows);
    hero3D.position.set(5.3 * WORLD_TILE_SIZE, 0.08, 8.8 * WORLD_TILE_SIZE);
    scene.add(hero3D);

    const raimundo3D = buildCharacter3DGroup(
      '#15803d',
      '#e6c373',
      '#d8d8d8',
      'Seu Raimundo',
      castShadows
    );
    raimundo3D.position.set(6.3 * WORLD_TILE_SIZE, 0.08, 8.4 * WORLD_TILE_SIZE);
    scene.add(raimundo3D);

    const canoe3D = buildCanoe3DGroup(castShadows);
    canoe3D.position.set(6.5 * WORLD_TILE_SIZE, 0.02, 14.8 * WORLD_TILE_SIZE);
    scene.add(canoe3D);

    const bus3D = buildBus3DGroup(castShadows);
    bus3D.position.set(12 * WORLD_TILE_SIZE, 0.08, 16 * WORLD_TILE_SIZE);
    scene.add(bus3D);

    const ro = new ResizeObserver(() => {
      const r = container.getBoundingClientRect();
      const nw = Math.max(320, Math.floor(r.width));
      const nh = Math.max(240, Math.floor(r.height));
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    });
    ro.observe(container);

    let frameId = 0;
    let lastTime = performance.now();
    let elapsed = 0;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (gl && typeof gl.fenceSync === 'function') {
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (state === gl.UNSIGNALED) {
            frameId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            frameId = window.setTimeout(cb, 80);
          }
        };
        frameId = window.setTimeout(poll, 5);
      } else {
        frameId = window.setTimeout(cb, 80);
      }
    }

    const tick = () => {
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.2);
      lastTime = now;
      elapsed += dt;

      for (const wm of waterMeshes) {
        const phase = wm.userData.phase ?? 0;
        wm.position.y = -0.14 + Math.sin(elapsed * 2.2 + phase) * 0.035;
      }

      animateCharacter3D(hero3D, 'down', elapsed, false, 'enxada', Math.sin(elapsed * 2) * 0.25);
      animateCharacter3D(raimundo3D, 'down', elapsed + 1.2, false, 'semente', Math.cos(elapsed * 2) * 0.2);
      bus3D.position.x = (10 + Math.sin(elapsed * 0.45) * 4) * WORLD_TILE_SIZE;

      // Câmera 2.5D focada nos personagens à direita do menu principal (sem ninguém escondido atrás do menu)
      const camX = 5.7 * WORLD_TILE_SIZE + Math.sin(elapsed * 0.35) * 0.75;
      const camZ = 12.6 * WORLD_TILE_SIZE + Math.cos(elapsed * 0.35) * 0.45;
      camera.position.set(camX, 3.45, camZ);
      camera.lookAt(5.5 * WORLD_TILE_SIZE, 1.35, 8.4 * WORLD_TILE_SIZE);

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      ro.disconnect();
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#120b07] select-none flex flex-col justify-between">
      {/* MUNDO 3D VIVO EM SEGUNDO PLANO */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />

      {/* Vinheta cinematográfica suave */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(180deg, rgba(10,6,3,0.45) 0%, rgba(10,6,3,0.06) 46%, rgba(10,6,3,0.68) 100%)'
        }}
      />

      {/* TOPO: BRASÃO ENTALHADO EM MADEIRA "AMAZÔNIA: CHAMADO RIBEIRINHO ACREANO" */}
      <div className="relative z-10 w-full pt-4 sm:pt-6 px-4 flex flex-col items-center pointer-events-none">
        <svg
          viewBox="0 0 560 155"
          className="w-full max-w-[440px] sm:max-w-[520px] drop-shadow-[0_12px_24px_rgba(0,0,0,0.85)]"
          role="img"
          aria-label="Amazônia — Chamado Ribeirinho Acreano"
        >
          <path d="M48 68 Q12 40 24 20 Q56 26 74 56 Z" fill="#2d6a30" stroke="#143316" strokeWidth="3" />
          <path d="M56 85 Q16 75 18 52 Q52 50 76 74 Z" fill="#52b748" stroke="#143316" strokeWidth="3" />
          <path d="M512 68 Q548 40 536 20 Q504 26 486 56 Z" fill="#2d6a30" stroke="#143316" strokeWidth="3" />
          <path d="M504 85 Q544 75 542 52 Q508 50 484 74 Z" fill="#52b748" stroke="#143316" strokeWidth="3" />

          <rect
            x="52"
            y="18"
            width="456"
            height="86"
            rx="18"
            fill="#4f2b15"
            stroke="#241106"
            strokeWidth="5"
          />
          <rect
            x="60"
            y="25"
            width="440"
            height="72"
            rx="13"
            fill="#6e3e1f"
            stroke="#c48a47"
            strokeWidth="2.5"
          />

          <text
            x="280"
            y="77"
            textAnchor="middle"
            fill="#ffdf78"
            stroke="#261205"
            strokeWidth="8"
            paintOrder="stroke fill"
            fontFamily="Outfit, sans-serif"
            fontWeight="900"
            fontSize="54"
            letterSpacing="3"
          >
            AMAZÔNIA
          </text>

          <rect
            x="106"
            y="94"
            width="348"
            height="36"
            rx="10"
            fill="#1b5e7a"
            stroke="#102b38"
            strokeWidth="4"
          />
          <rect
            x="111"
            y="98"
            width="338"
            height="28"
            rx="7"
            fill="#26799c"
            stroke="#ebba60"
            strokeWidth="1.8"
          />
          <text
            x="280"
            y="117"
            textAnchor="middle"
            fill="#fff8e6"
            fontFamily="Plus Jakarta Sans, sans-serif"
            fontWeight="800"
            fontSize="14.5"
            letterSpacing="1.6"
          >
            CHAMADO RIBEIRINHO ACREANO · 3D
          </text>
        </svg>
      </div>

      {/* MENU PRINCIPAL COMPACTO SOBRE O DIORAMA 3D */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-8 pb-6 sm:pb-10 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
        <div className="flex flex-col gap-2.5 w-60 sm:w-68">
          <nav
            aria-label="Menu Principal"
            className="rounded-2xl p-3 shadow-2xl border-2 flex flex-col gap-1.5"
            style={{
              backgroundColor: 'rgba(42, 24, 12, 0.94)',
              borderColor: '#c48d4e',
              boxShadow: '0 14px 32px rgba(0,0,0,0.78), inset 0 1px 0 rgba(255,230,170,0.28)'
            }}
          >
            <button
              type="button"
              data-start="true"
              onClick={() => onStartNewGame(true)}
              className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-[#6e3f1f] hover:bg-[#874f28] active:scale-[0.99] text-[#fff6df] font-extrabold text-sm text-left flex items-center gap-2 border border-[#e0b263] shadow-md cursor-pointer transition-all"
            >
              <span className="text-[#ffd56b] text-base leading-none">➜</span>
              <span>Novo Jogo (Animação 3D)</span>
            </button>

            <button
              type="button"
              onClick={() => (hasSavedGame ? onContinueGame() : onStartNewGame(false))}
              className="w-full min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#422512]/90 hover:bg-[#593319] text-[#f2e2c4] font-bold text-sm text-left flex items-center justify-between border border-[#825432] cursor-pointer transition-colors"
            >
              <span className="pl-5">Continuar / Jogo Livre</span>
              {hasSavedGame && (
                <span className="text-[10px] text-[#a5cf61] font-semibold">Salvo</span>
              )}
            </button>

            <button
              type="button"
              onClick={onOpenLoadModal}
              className="w-full min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#422512]/90 hover:bg-[#593319] text-[#f2e2c4] font-bold text-sm text-left pl-8 border border-[#825432] cursor-pointer transition-colors"
            >
              Carregar Espaço
            </button>

            <button
              type="button"
              onClick={onOpenOptionsModal}
              className="w-full min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#422512]/90 hover:bg-[#593319] text-[#f2e2c4] font-bold text-sm text-left pl-8 border border-[#825432] cursor-pointer transition-colors"
            >
              Opções de Áudio
            </button>

            <button
              type="button"
              onClick={onOpenCreditsModal}
              className="w-full min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#422512]/90 hover:bg-[#593319] text-[#f2e2c4] font-bold text-sm text-left pl-8 border border-[#825432] cursor-pointer transition-colors"
            >
              Créditos
            </button>
          </nav>

          <div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-bold text-[#f7e7c4] shadow-lg w-fit"
            style={{
              backgroundColor: 'rgba(26, 16, 10, 0.92)',
              borderColor: '#8c6239'
            }}
          >
            <span className="text-[#ffd56b]">📍</span>
            <span>Cruzeiro do Sul - Acre (Mundo 3D)</span>
          </div>
        </div>

        <div className="text-[11px] font-semibold text-[#f5e7c6] bg-[#1a1009]/88 px-3.5 py-2 rounded-xl border border-[#704a2b]">
          WASD / Setas: Caminhar & Navegar em 3D · Espaço: Interagir · C: Câmera 3D
        </div>
      </div>
    </div>
  );
};
