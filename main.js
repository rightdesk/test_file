import * as THREE from "three"
import { OrbitControls } from "./three/examples/jsm/controls/OrbitControls.js";

const scene = new THREE.Scene();
const mouse = new THREE.Vector2();
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

const handleMouseMove = (event) => {
    const element = event.currentTarget;
    // canvas要素上のXY座標
    const x = event.clientX - element.offsetLeft;
    const y = event.clientY - element.offsetTop;
    // canvas要素の幅・高さ
    const w = element.offsetWidth;
    const h = element.offsetHeight;

    // -1〜+1の範囲で現在のマウス座標を登録する
    mouse.x = (x / w) * 2 - 1;
    mouse.y = -(y / h) * 2 + 1;
}

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth * 0.9, window.innerHeight * 0.9);
renderer.domElement.style.margin = "0 auto"
document.body.appendChild(renderer.domElement);
renderer.domElement.addEventListener("mousemove", handleMouseMove);

const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(2, 2, 2)
camera.lookAt(new THREE.Vector3(0.5, 0.5, 0.5))

scene.add(camera)

const light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 0.75);
light.position.set(0.5, 1, 0.75);
scene.add(light)
let meshList = []

const raycaster = new THREE.Raycaster();


const FIELDX = 3
const FIELDY = 3
const FIELDZ = 3
let field
const dxyz = [[0, 0, 1], [0, 1, 0], [1, 0, 0], [0, 0, -1], [0, -1, 0], [-1, 0, 0]]

let NodeSize=0.1
let BoxSize=1
let BoxOpacity=0.7
let rotateX=0
let rotateY=0
let rotateZ=0
let rotateVector=[1,-1]

let shiftFlg=0


const patarn = {
    4: [
        [[[[1, 1], [1, 0]], [[0, 0], [0, 0]]],new THREE.Group()], [[[[1, 0], [0, 0]], [[0, 0], [0, 0]]],new THREE.Group()]
    ],
    8: [
        [[[[1, 1], [1, 0]], [[1, 0], [0, 0]]],new THREE.Group()], [[[[0, 0], [0, 1]], [[0, 1], [1, 1]]],new THREE.Group()],
        [[[[1, 1], [1, 1]], [[0, 0], [0, 0]]],new THREE.Group()], [[[[0, 0], [0, 0]], [[1, 1], [1, 1]]],new THREE.Group()]
    ]
}
for (let i in patarn) {
    for (let j=0;j<patarn[i].length;j++) {
        //patarn[i][j][0]をグループ化
        for (let y=0;y<patarn[i][j][0].length;y++) {
            for (let x=0;x<patarn[i][j][0][y].length;x++) {
                for (let z=0;z<patarn[i][j][0][y][x].length;z++) {
                    if (patarn[i][j][0][y][x][z]) {
                        let material=new THREE.MeshBasicMaterial({color:0x66CCFF})
                        material.opacity=BoxOpacity
                        material.transparent=true

                        let geometry=new THREE.BoxGeometry(BoxSize,BoxSize,BoxSize)
                        let mesh=new THREE.Mesh(geometry,material)
                        mesh.position.set(x*BoxSize,y*BoxSize,z*BoxSize)
                        patarn[i][j][1].add(mesh)
                    }
                }
                
            }
        }

    }
}
let haveBox=4;
let haveDrawBox=0
const btn1=document.getElementById("btn_1")
let clickFlg=0

const SetField = () => {
    let field = new Array();
    for (let y = 0; y < FIELDY; y++) {
        field[y] = new Array()
        for (let x = 0; x < FIELDX; x++) {
            field[y][x] = new Array()
            for (let z = 0; z < FIELDZ; z++) {
                field[y][x][z] = 0
                let material = new THREE.MeshBasicMaterial({ color: 0xFFFFFF })
                let geometry = new THREE.BoxGeometry(NodeSize, NodeSize, NodeSize)
                let mesh = new THREE.Mesh(geometry, material)
                mesh.position.set(Math.floor(BoxSize/2)+BoxSize*x-NodeSize, Math.floor(BoxSize/2)+BoxSize*y-NodeSize, Math.floor(BoxSize/2)+BoxSize*z-NodeSize)
                mesh.name = "NODE"
                scene.add(mesh)
                meshList.push(mesh)

            }
        }
    }
    return field
}
const punctuate = (patarn4_num, patarn8_num) => {
    let que = []
    for (let i = 0; i < patarn4_num; i++) {
        que.push(patarn[4][i % patarn[4].length])
    }
    for (let i = 0; i < patarn8_num; i++) {
        que.push(patarn[8][i % patarn[8].length])
    }
    return que
}
const fill2Darray=(ary)=>{
    for (let i=0;i<ary.length;i++) {
        for (let j=0;j<ary[i].length;j++) {
            ary[i][j]=0
        }
    }
    return ary
}
const fill=(ary1,ary2)=>{
    for (let i=0;i<ary1.length;i++) {
        for (let j=0;j<ary1[i].length;j++) {
            ary2[i][j]=0
            ary2[i][j]+=ary1[i][j]
        }
    }
    return ary2
}
const Rotate3D = (mesh,matrix,rotateY,rotateX,rotateZ) => {
    let newMatrix = new Array();
    for (let y = 0; y < 2; y++) {
        newMatrix[y] = new Array();
        for (let x = 0; x < 2; x++) {
            newMatrix[y][x] = new Array()
            for (let z = 0; z < 2; z++) {
                newMatrix[y][x][z] = 0
            }
        }
    }
    for (let yr=0;yr<rotateY;yr++) {
        for (let y = 0; y < 2; y++) {
            const rotate = a => a[0].map((_, c) => a.map(r => r[c])).reverse();
            matrix[y]=rotate(matrix[y])
            matrix[y]=fill2Darray(matrix[y],matrix[y])
            console.log(matrix[y])
        }

    }
    
    // for (let xr=0;xr<rotateX;xr++) {
    //     for (let y = 0; y < matrix.length; y++) {
    //         for (let x = 0; x < matrix[y].length; x++) {
    //             for (let z = 0; z < matrix[y][x].length; z++) {
    //                 newMatrix[y][x][z]=matrix[y][x][z]
    //             }
    //         }
    //     }
    // }
    // for (let zr=0;zr<rotateX;zr++) {
    //     for (let y = 0; y < matrix.length; y++) {
    //         for (let x = 0; x < matrix[y].length; x++) {
    //             for (let z = 0; z < matrix[y][x].length; z++) {
    //                 newMatrix[y][x][z]=matrix[y][x][z]
    //             }
    //         }
    //     }
    // }
    mesh.rotation.x=Math.PI/2*rotateX
    mesh.rotation.y=Math.PI/2*rotateY
    mesh.rotation.z=Math.PI/2*rotateZ
    // console.log(newMatrix)
    // console.log(empNewMatrix)
    mesh.mtx=newMatrix
}
const check=(field,matrix,dy,dx,dz)=>{
    for (let y=0;y<matrix.length;y++) {
        for (let x=0;x<matrix.length;x++) {
            for (let z=0;z<matrix.length;z++) {
                if (matrix[y][x][z]) {
                    if (dy+y>=FIELDY || dx+x>=FIELDX || dz+z>=FIELDZ) {
                        return false
                    }
                    if (field[dy+y][dx+x][dz+z]) {
                        return false
                    }
                }
            }
        }
    }
    return true
}
const put=(matrix,object,dy,dx,dz)=>{
    for (let i=0;i<object.children.length;i++) {
        object.children[i].material=new THREE.MeshBasicMaterial({color:0x6666FF})
    }
    for (let y=0;y<matrix.length;y++) {
        for (let x=0;x<matrix[y].length;x++) {
            for (let z=0;z<matrix[y][x].length;z++) {
                if (dy+y>=FIELDY || dx+x>=FIELDX || dz+z>=FIELDZ) continue
                if (matrix[y][x][z]) field[y+dy][x+dx][z+dz]=1
            }
        }
    }
    object.name="PUT"
    object.position.set(dx,dy,dz)
    object.tmp=[dy,dx,dz,matrix]
    scene.add(object)
    meshList.push(object)
}

const animate = () => {
    raycaster.setFromCamera(mouse, camera);

    // その光線とぶつかったオブジェクトを得る
    const intersects = raycaster.intersectObjects(meshList);
    if (haveDrawBox && intersects.length==0) {
        scene.remove(scene.children.filter((obj)=>obj.name=="haveBox")[0])
        haveDrawBox=0
    }
    if (intersects.length>0) {
        for (let i=0;i<intersects.length;i++) {
            if (intersects[i].object.name=="NODE") {
                let x=(intersects[i].object.position.x+NodeSize+Math.floor(BoxSize/2))/BoxSize
                let y=(intersects[i].object.position.y+NodeSize+Math.floor(BoxSize/2))/BoxSize
                let z=(intersects[i].object.position.z+NodeSize+Math.floor(BoxSize/2))/BoxSize
                if (!haveDrawBox) {
                    // let obj=patarn[haveBox][Math.floor(Math.random()*patarn[haveBox].length)]
                    let obj=patarn[haveBox][0]
                    let mesh=obj[1].clone()
                    mesh.name="haveBox"
                    mesh.mtx=obj[0]
                    mesh.position.set(x,y,z)
                    scene.add(mesh)
                    haveDrawBox=1
                } else {
                    let mesh=scene.children.filter((obj)=>obj.name=="haveBox")[0]
                    let matrix=mesh.mtx
                    if (mesh.rotation.x!=Math.PI/2*rotateX || mesh.rotation.z!=Math.PI/2*rotateZ || mesh.rotation.y!=Math.PI/2*rotateY) {
                        Rotate3D(mesh,matrix,rotateY,rotateX,rotateZ)
                    }
                    
                }

                if (clickFlg) {
                    let mesh=scene.children.filter((obj)=>obj.name=="haveBox")[0]
                    console.log("y x z:",y,x,z)
                    if (check(field,mesh.mtx,y,x,z)) {
                        put(mesh.mtx,mesh.clone(),y,x,z)
                    }

                }
                    clickFlg=0
                break
            }
            //削除
            if (intersects[i].object.parent.name=="PUT" && clickFlg) {
                let target=intersects[i].object.parent
                let dy=target.tmp[0]
                let dx=target.tmp[1]
                let dz=target.tmp[2]
                let matrix=target.tmp[3]
                for (let y=0;y<matrix.length;y++) {
                    for (let x=0;x<matrix[y].length;x++) {
                        for (let z=0;z<matrix[y][x].length;z++) {
                            if (dy+y>=FIELDY || dx+x>=FIELDX || dz+z>=FIELDZ) continue
                            if (matrix[y][x][z]) field[y+dy][x+dx][z+dz]=0
                        }
                    }
                }
                meshList=meshList.filter((a)=>a!=target)
                scene.remove(scene.children.filter((obj)=>obj==target)[0])
                clickFlg=0
                break
            }
        }
    }
    clickFlg=0

    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

const init = () => {
    meshList = []
    const ALLSIZE = FIELDX * FIELDY * FIELDZ
    const patarn8_num = Math.floor(ALLSIZE / 8)
    const patarn4_num = Math.floor((ALLSIZE - 8 * Math.floor(ALLSIZE / 8)) / 4)
    field = SetField()
    let que = punctuate(patarn4_num, patarn8_num)
    animate();
    
}
const onClickModule=()=>{
    clickFlg=1
}
const onKeyDown=(e)=>{
    if (e.code=="ShiftLeft" || e.code=="ShiftRight") {
        shiftFlg=(shiftFlg+1)%2
    }
}
const  onKeyUp = (e) => {
    console.log(e.code)
    switch (e.code) {
      case 'KeyX':
        rotateX=(rotateX+rotateVector[shiftFlg])%4
        break
      case 'KeyY':
        rotateY=(rotateY+rotateVector[shiftFlg])%4
        break
      case 'KeyZ':
        rotateZ=(rotateZ+rotateVector[shiftFlg])%4
        break
      case "ShiftLeft":
        shiftFlg=0
      case "ShiftRight":
        shiftFlg=0
    }
  }
window.addEventListener("DOMContentLoaded", init)
window.addEventListener("click",onClickModule)
document.addEventListener('keydown',onKeyDown)
document.addEventListener('keyup',onKeyUp)


