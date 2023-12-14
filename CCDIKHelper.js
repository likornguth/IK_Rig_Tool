import {
    BufferAttribute,
    BufferGeometry,
    Color,
    Line,
    LineBasicMaterial,
    Matrix4,
    Mesh,
    MeshBasicMaterial,
    Object3D,
    Quaternion,
    SphereGeometry,
    Vector3
  } from "three";
  
  const _matrix = new Matrix4();
  const _vector = new Vector3();
  function getPosition(bone, matrixWorldInv) {
    return _vector
      .setFromMatrixPosition(bone.matrixWorld)
      .applyMatrix4(matrixWorldInv);
  }
  function setPositionOfBoneToAttributeArray(array, index, bone, matrixWorldInv) {
    const v = getPosition(bone, matrixWorldInv);
  
    array[index * 3 + 0] = v.x;
    array[index * 3 + 1] = v.y;
    array[index * 3 + 2] = v.z;
  }
  class CCDIKHelper extends Object3D {
    constructor(mesh, iks = []) {
      super();
  
      this.root = mesh;
      this.iks = iks;
  
      this.matrix.copy(mesh.matrixWorld);
      this.matrixAutoUpdate = false;
  
      this.sphereGeometry = new SphereGeometry(0.05, 16, 8);
  
      this.targetSphereMaterial = new MeshBasicMaterial({
        color: new Color(0xff8888),
        depthTest: false,
        depthWrite: false,
        transparent: true
      });
  
      this.effectorSphereMaterial = new MeshBasicMaterial({
        color: new Color(0x88ff88),
        depthTest: false,
        depthWrite: false,
        transparent: true
      });
  
      this.linkSphereMaterial = new MeshBasicMaterial({
        color: new Color(0x8888ff),
        depthTest: false,
        depthWrite: false,
        transparent: true
      });
  
      this.lineMaterial = new LineBasicMaterial({
        color: new Color(0xff0000),
        depthTest: false,
        depthWrite: false,
        transparent: true
      });
  
      this._init();
    }
  
    /**
     * Updates IK bones visualization.
     */
    updateMatrixWorld(force) {
      const mesh = this.root;
  
      if (this.visible) {
        let offset = 0;
  
        const iks = this.iks;
        const bones = mesh.skeleton.bones;
  
        _matrix.copy(mesh.matrixWorld).invert();
  
        for (let i = 0, il = iks.length; i < il; i++) {
          const ik = iks[i];
  
          const targetBone = bones[ik.target];
          const effectorBone = bones[ik.effector];
  
          const targetMesh = this.children[offset++];
          const effectorMesh = this.children[offset++];
  
          targetMesh.position.copy(getPosition(targetBone, _matrix));
          effectorMesh.position.copy(getPosition(effectorBone, _matrix));
  
          for (let j = 0, jl = ik.links.length; j < jl; j++) {
            const link = ik.links[j];
            const linkBone = bones[link.index];
  
            const linkMesh = this.children[offset++];
  
            linkMesh.position.copy(getPosition(linkBone, _matrix));
          }
  
          const line = this.children[offset++];
          const array = line.geometry.attributes.position.array;
  
          setPositionOfBoneToAttributeArray(array, 0, targetBone, _matrix);
          setPositionOfBoneToAttributeArray(array, 1, effectorBone, _matrix);
  
          for (let j = 0, jl = ik.links.length; j < jl; j++) {
            const link = ik.links[j];
            const linkBone = bones[link.index];
            setPositionOfBoneToAttributeArray(array, j + 2, linkBone, _matrix);
          }
  
          line.geometry.attributes.position.needsUpdate = true;
        }
      }
  
      this.matrix.copy(mesh.matrixWorld);
  
      super.updateMatrixWorld(force);
    }
  
    // private method
  
    _init() {
      const scope = this;
      const iks = this.iks;
  
      function createLineGeometry(ik) {
        const geometry = new BufferGeometry();
        const vertices = new Float32Array((2 + ik.links.length) * 3);
        geometry.setAttribute("position", new BufferAttribute(vertices, 3));
  
        return geometry;
      }
  
      function createTargetMesh() {
        return new Mesh(scope.sphereGeometry, scope.targetSphereMaterial);
      }
  
      function createEffectorMesh() {
        return new Mesh(scope.sphereGeometry, scope.effectorSphereMaterial);
      }
  
      function createLinkMesh() {
        return new Mesh(scope.sphereGeometry, scope.linkSphereMaterial);
      }
  
      function createLine(ik) {
        return new Line(createLineGeometry(ik), scope.lineMaterial);
      }
  
      for (let i = 0, il = iks.length; i < il; i++) {
        const ik = iks[i];
  
        this.add(createTargetMesh());
        this.add(createEffectorMesh());
  
        for (let j = 0, jl = ik.links.length; j < jl; j++) {
          this.add(createLinkMesh());
        }
  
        this.add(createLine(ik));
      }
    }
  }
  
  export default CCDIKHelper;