import React, { useRef, useState, useEffect, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Float } from '@react-three/drei';
import * as THREE from 'three';
import { Layers, Users, CheckCircle, Clock, Zap, Pause, Play, Eye } from 'lucide-react';

/**
 * 3D Node Mesh Component
 */
function NodeMesh({
  position,
  color,
  size = 0.35,
  label,
  isSelected,
  onClick,
  isCore = false,
}) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    if (isCore) {
      meshRef.current.rotation.y += delta * 0.4;
      meshRef.current.rotation.x += delta * 0.2;
    } else {
      meshRef.current.rotation.y += delta * 0.2;
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          if (onClick) onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
        scale={hovered ? [1.25, 1.25, 1.25] : isSelected ? [1.15, 1.15, 1.15] : [1, 1, 1]}
      >
        {isCore ? (
          <octahedronGeometry args={[size * 1.5, 0]} />
        ) : (
          <sphereGeometry args={[size, 16, 16]} />
        )}
        <meshStandardMaterial
          color={hovered || isSelected ? '#ffffff' : color}
          emissive={color}
          emissiveIntensity={hovered || isSelected ? 1.2 : 0.4}
          roughness={0.2}
          metalness={0.8}
          wireframe={isCore}
        />
      </mesh>

      {/* Inner glowing core for selected or central node */}
      {isCore && (
        <mesh scale={[0.7, 0.7, 0.7]}>
          <octahedronGeometry args={[size, 0]} />
          <meshBasicMaterial color={color} />
        </mesh>
      )}

      {/* Label */}
      {label && (
        <Text
          position={[0, -size - 0.25, 0]}
          fontSize={0.22}
          color="#cbd5e1"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.03}
          outlineColor="#090d16"
        >
          {label}
        </Text>
      )}
    </group>
  );
}

/**
 * 3D Connection Line
 */
function ConnectionLine({ start, end, color = '#6366f1', opacity = 0.35 }) {
  const lineGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const points = [new THREE.Vector3(...start), new THREE.Vector3(...end)];
    geometry.setFromPoints(points);
    return geometry;
  }, [start, end]);

  return (
    <primitive object={new THREE.Line(
      lineGeometry,
      new THREE.LineBasicMaterial({
        color: new THREE.Color(color),
        transparent: true,
        opacity,
        linewidth: 1,
      })
    )} />
  );
}

/**
 * Main 3D Scene Inside Canvas
 */
function SceneNetwork({
  projects = [],
  selectedProjectId,
  onSelectProject,
  reducedMotion = false,
  isRotating = true,
}) {
  const groupRef = useRef();

  // Find active project
  const activeProject = useMemo(() => {
    if (!projects || projects.length === 0) return null;
    return projects.find((p) => p._id === selectedProjectId) || projects[0];
  }, [projects, selectedProjectId]);

  // Derived satellites (assigned employees & tasks for this project)
  const networkData = useMemo(() => {
    if (!activeProject) return { corePos: [0, 0, 0], employees: [], tasks: [] };

    const corePos = [0, 0, 0];

    // Employees (arranged in inner circle)
    const empList = activeProject.assignedEmployees || [];
    const empRadius = 2.4;
    const employees = empList.map((emp, i) => {
      const angle = (i / Math.max(empList.length, 1)) * Math.PI * 2;
      return {
        id: emp._id || i,
        name: emp.name ? emp.name.split(' ')[0] : `Emp ${i + 1}`,
        position: [
          Math.cos(angle) * empRadius,
          (Math.sin(angle * 2) * 0.4) + 0.3,
          Math.sin(angle) * empRadius,
        ],
        color: '#06b6d4', // Cyan for employees
      };
    });

    // Tasks (arranged in outer circle)
    const taskCount = Math.min(activeProject.totalTasks || 4, 8);
    const taskRadius = 3.6;
    const tasks = [];
    for (let i = 0; i < taskCount; i++) {
      const angle = (i / Math.max(taskCount, 1)) * Math.PI * 2 + 0.4;
      const isCompleted = i < (activeProject.completedTasks || 0);
      tasks.push({
        id: `task-${i}`,
        name: `T${i + 1}`,
        position: [
          Math.cos(angle) * taskRadius,
          (Math.sin(angle * 3) * 0.5) - 0.2,
          Math.sin(angle) * taskRadius,
        ],
        color: isCompleted ? '#10b981' : '#f59e0b', // Emerald for completed, Amber for pending
      });
    }

    return { corePos, employees, tasks };
  }, [activeProject]);

  // Slow continuous rotation of the whole constellation
  useFrame((state, delta) => {
    if (groupRef.current && isRotating && !reducedMotion) {
      groupRef.current.rotation.y += delta * 0.15;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Visual Orbit Tracks */}
      <OrbitRing radius={2.4} color="#06b6d4" opacity={0.16} />
      <OrbitRing radius={3.6} color="#6366f1" opacity={0.12} />

      {/* Central Core: Project */}
      {activeProject && (
        <NodeMesh
          position={networkData.corePos}
          size={0.65}
          color="#6366f1"
          label={activeProject.name ? (activeProject.name.length > 18 ? activeProject.name.slice(0, 16) + '...' : activeProject.name) : 'Project Core'}
          isSelected={true}
          isCore={true}
        />
      )}

      {/* Employee Satellite Nodes & Lines to Core */}
      {networkData.employees.map((emp) => (
        <React.Fragment key={emp.id}>
          <NodeMesh
            position={emp.position}
            size={0.28}
            color={emp.color}
            label={emp.name}
          />
          <ConnectionLine
            start={networkData.corePos}
            end={emp.position}
            color="#06b6d4"
            opacity={0.45}
          />
        </React.Fragment>
      ))}

      {/* Task Nodes & Lines to Core/Employees */}
      {networkData.tasks.map((task, idx) => {
        // Connect each task to core or nearest employee
        const targetEmp = networkData.employees[idx % Math.max(networkData.employees.length, 1)];
        const connectionTarget = targetEmp ? targetEmp.position : networkData.corePos;

        return (
          <React.Fragment key={task.id}>
            <NodeMesh
              position={task.position}
              size={0.22}
              color={task.color}
              label={task.name}
            />
            <ConnectionLine
              start={connectionTarget}
              end={task.position}
              color={task.color}
              opacity={0.3}
            />
          </React.Fragment>
        );
      })}
    </group>
  );
}

/**
 * Delicate Orbit Ring Path
 */
function OrbitRing({ radius, color = '#6366f1', opacity = 0.15 }) {
  const lineGeometry = useMemo(() => {
    const points = [];
    const segments = 64;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius));
    }
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [radius]);

  return (
    <primitive
      object={
        new THREE.Line(
          lineGeometry,
          new THREE.LineBasicMaterial({
            color: new THREE.Color(color),
            transparent: true,
            opacity,
          })
        )
      }
    />
  );
}

/**
 * 2D Fallback Component for environments where WebGL is unsupported or disabled
 */
function Fallback2DNetwork({ activeProject }) {
  if (!activeProject) return null;

  const employees = activeProject.assignedEmployees || [];
  const totalTasks = activeProject.totalTasks || 0;
  const completedTasks = activeProject.completedTasks || 0;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center select-none relative">
      <div className="relative w-64 h-64 flex items-center justify-center">
        {/* Outer Orbit Line */}
        <div className="absolute inset-2 rounded-full border border-dashed border-indigo-500/20"></div>
        {/* Inner Orbit Line */}
        <div className="absolute inset-14 rounded-full border border-cyan-500/20"></div>

        {/* Central Core Node */}
        <div className="relative z-20 w-24 h-24 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 p-2.5 shadow-xl shadow-indigo-600/30 flex flex-col items-center justify-center text-center border border-indigo-400/40">
          <Layers className="w-5 h-5 text-white mb-1" />
          <p className="text-[11px] font-bold text-white line-clamp-2 leading-tight">
            {activeProject.name}
          </p>
          <span className="text-[9px] font-medium text-indigo-200 mt-0.5">
            {activeProject.progress || 0}% Complete
          </span>
        </div>

        {/* Orbiting Employee Nodes (Inner ring) */}
        {employees.slice(0, 4).map((emp, i) => {
          const angle = (i / Math.max(Math.min(employees.length, 4), 1)) * Math.PI * 2;
          const x = Math.cos(angle) * 78;
          const y = Math.sin(angle) * 78;
          return (
            <div
              key={emp._id || i}
              style={{ transform: `translate(${x}px, ${y}px)` }}
              className="absolute z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-950/90 border border-cyan-700/60 shadow-lg"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
              <span className="text-[9px] font-semibold text-cyan-200 max-w-[55px] truncate">
                {emp.name ? emp.name.split(' ')[0] : `Emp ${i + 1}`}
              </span>
            </div>
          );
        })}

        {/* Orbiting Task Nodes (Outer ring) */}
        {Array.from({ length: Math.min(totalTasks, 6) }).map((_, i) => {
          const angle = (i / Math.min(totalTasks, 6)) * Math.PI * 2 + 0.4;
          const x = Math.cos(angle) * 118;
          const y = Math.sin(angle) * 118;
          const isDone = i < completedTasks;
          return (
            <div
              key={i}
              style={{ transform: `translate(${x}px, ${y}px)` }}
              className={`absolute z-10 w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold border shadow-md ${
                isDone
                  ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                  : 'bg-amber-950 border-amber-500 text-amber-300'
              }`}
              title={isDone ? `Task ${i + 1} (Completed)` : `Task ${i + 1} (Pending)`}
            >
              {i + 1}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-2">
        <span className="text-cyan-400">● {employees.length} Members</span>
        <span className="text-emerald-400">● {completedTasks} Completed</span>
        <span className="text-amber-400">● {totalTasks - completedTasks} Pending</span>
      </div>
    </div>
  );
}

/**
 * Robust Error Boundary to catch any WebGL context loss or driver initialization failures
 */
class CanvasErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err) {
    console.warn('ProjectCore3D WebGL context error handled gracefully:', err);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

/**
 * Main Exported ProjectCore3D Component
 */
export default function ProjectCore3D({
  projects = [],
  selectedProjectId,
  onSelectProject,
}) {
  const [hasWebGL, setHasWebGL] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isRotating, setIsRotating] = useState(true);
  const [viewMode, setViewMode] = useState('3d'); // '3d' or '2d'

  // Check WebGL availability
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl =
        canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      setHasWebGL(Boolean(gl));
    } catch {
      setHasWebGL(false);
    }

    // Check prefers-reduced-motion
    if (window.matchMedia) {
      const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(motionQuery.matches);
      const listener = (e) => setReducedMotion(e.matches);
      motionQuery.addEventListener('change', listener);
      return () => motionQuery.removeEventListener('change', listener);
    }
  }, []);

  const activeProject = useMemo(() => {
    if (!projects || projects.length === 0) return null;
    return projects.find((p) => p._id === selectedProjectId) || projects[0];
  }, [projects, selectedProjectId]);

  const show3D = hasWebGL && viewMode === '3d';

  return (
    <div className="relative overflow-hidden rounded-xl bg-[#0d111a] border border-[#1a2233] p-4 sm:p-5 flex flex-col justify-between h-[440px] sm:h-[460px]">
      {/* Top Bar with Title, Legend & Controls */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#182030]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#141a27] border border-[#1e283d] text-indigo-400">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              Project Topology Core
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#161d2d] text-slate-400 border border-[#222e46]">
                {show3D ? 'WebGL' : '2D Graph'}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Relational architecture: Project Core → Assigned Members → Deliverables
            </p>
          </div>
        </div>

        {/* Legend & View Toggles */}
        <div className="flex items-center gap-2.5 text-[11px] text-slate-400">
          <span className="hidden sm:flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500"></span>
            Project
          </span>
          <span className="hidden sm:flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            Employees
          </span>
          <span className="hidden sm:flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Tasks
          </span>

          {/* 3D / 2D Selector */}
          <div className="flex items-center rounded-lg bg-slate-900 border border-slate-800 p-0.5">
            <button
              onClick={() => setViewMode('3d')}
              disabled={!hasWebGL}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                show3D
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              3D
            </button>
            <button
              onClick={() => setViewMode('2d')}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                !show3D
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              2D
            </button>
          </div>

          {show3D && (
            <button
              onClick={() => setIsRotating(!isRotating)}
              title={isRotating ? 'Pause rotation' : 'Resume rotation'}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              {isRotating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* 3D Canvas / 2D Fallback Area */}
      <div className="relative flex-1 w-full h-full my-1">
        {show3D ? (
          <CanvasErrorBoundary fallback={<Fallback2DNetwork activeProject={activeProject} />}>
            <Canvas
              camera={{ position: [0, 2.5, 7.5], fov: 45 }}
              style={{ width: '100%', height: '100%' }}
              gl={{ alpha: true, antialias: true, failIfMajorPerformanceCaveat: false }}
            >
              <ambientLight intensity={0.7} />
              <pointLight position={[10, 10, 10]} intensity={1.2} />
              <pointLight position={[-10, -10, -10]} intensity={0.5} color="#06b6d4" />
              
              <Suspense fallback={null}>
                <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.4}>
                  <SceneNetwork
                    projects={projects}
                    selectedProjectId={activeProject?._id}
                    onSelectProject={onSelectProject}
                    reducedMotion={reducedMotion}
                    isRotating={isRotating}
                  />
                </Float>
              </Suspense>

              <OrbitControls
                enablePan={false}
                enableZoom={false}
                minPolarAngle={Math.PI / 4}
                maxPolarAngle={Math.PI / 1.7}
              />
            </Canvas>
          </CanvasErrorBoundary>
        ) : (
          <Fallback2DNetwork activeProject={activeProject} />
        )}
      </div>

      {/* Bottom Project Selector Pills */}
      {projects && projects.length > 0 && (
        <div className="relative z-10 pt-2.5 border-t border-[#182030] flex items-center justify-between gap-2 overflow-x-auto">
          <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap">
            Target Project:
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            {projects.map((proj) => {
              const isSelected = activeProject?._id === proj._id;
              return (
                <button
                  key={proj._id}
                  onClick={() => onSelectProject(proj._id)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all duration-150 whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-[#121824] text-slate-400 hover:text-white hover:bg-[#161f30] border border-[#1a2336]'
                  }`}
                >
                  {proj.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
