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

//マウスの座標をraycasterで使えるように調整する関数
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

let can=document.querySelector('#myCanvas')
const renderer = new THREE.WebGLRenderer(
    {canvas: can}
);
renderer.setSize(window.innerWidth * 0.98, window.innerHeight * 0.9);
// renderer.domElement.style.margin = "0 auto"
// document.body.appendChild(can);
renderer.domElement.addEventListener("mousemove", handleMouseMove);

const controls = new OrbitControls(camera, can);
let meshList = []

const raycaster = new THREE.Raycaster();


const FIELDX = 3
const FIELDY = 3
const FIELDZ = 4
let Answer=FIELDX*FIELDY*FIELDZ
let BlockCount=0
const GSize = 2
let field

let NodeSize = 0.2
let BoxSize = 1
let BoxOpacity = 0.7

let rotateY = 0
camera.position.set(FIELDX*1.3*BoxSize, FIELDY*1.3*BoxSize, FIELDZ**BoxSize)
camera.lookAt(new THREE.Vector3(0.5, 0.5, 0.5))
scene.add(camera)

//rotetaすると行列の回転とmeshの回転が一致しない...
const rotplusY_Z = [0, 1, 1, 0]
const rotplusY_X = [0, 0, 1, 1]


const patarn = {
    "WL": [
        [[[[1, 1], [1, 0]], [[0, 0], [0, 0]]], new THREE.Group()], [[[[0, 0], [0, 0]], [[0, 1], [1, 1]]], new THREE.Group()]
    ],
    "HWL": [
        [[[[1, 1], [1, 0]], [[1, 0], [0, 0]]], new THREE.Group()], [[[[0, 0], [0, 1]], [[0, 1], [1, 1]]], new THREE.Group()]
    ],
    "S" :[
        [[[[1, 1], [1, 1]], [[0, 0], [0, 0]]], new THREE.Group()], [[[[0, 0], [0, 0]], [[1, 1], [1, 1]]], new THREE.Group()]
    ],
    "HL": [[[[[1, 1], [0, 0]], [[1, 0], [0, 0]]], new THREE.Group()], [[[[0, 0], [0, 1]], [[0, 0], [1, 1]]], new THREE.Group()]
    ]
}
for (let i in patarn) {
    for (let j = 0; j < patarn[i].length; j++) {
        //patarn[i][j][0]をグループ化
        for (let y = 0; y < patarn[i][j][0].length; y++) {
            for (let x = 0; x < patarn[i][j][0][y].length; x++) {
                for (let z = 0; z < patarn[i][j][0][y][x].length; z++) {
                    if (patarn[i][j][0][y][x][z]) {
                        let material = new THREE.MeshBasicMaterial({ color: 0x66CCFF })
                        material.opacity = BoxOpacity
                        material.transparent = true

                        let geometry = new THREE.BoxGeometry(BoxSize, BoxSize, BoxSize)
                        let mesh = new THREE.Mesh(geometry, material)
                        mesh.position.set(x * BoxSize, y * BoxSize, z * BoxSize)
                        patarn[i][j][1].add(mesh)
                    }
                }

            }
        }

    }
}
let haveBox = "WL";
let haveBoxRev=0
let haveDrawBox = 0
const btnWL = document.getElementById("btn_WL")
const btnHL = document.getElementById("btn_HL")
const btnHWL = document.getElementById("btn_HWL")
const btnS = document.getElementById("btn_S")

let clickFlg = 0

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
                mesh.position.set(Math.floor(BoxSize / 2) + BoxSize * x - NodeSize, Math.floor(BoxSize / 2) + BoxSize * y - NodeSize, Math.floor(BoxSize / 2) + BoxSize * z - NodeSize)
                mesh.name = "NODE"
                scene.add(mesh)
                meshList.push(mesh)

            }
        }
    }
    return field
}
const makeArray = () => {
    let mtx2 = new Array();
    for (let y = 0; y < 2; y++) {
        mtx2[y] = new Array();
        for (let x = 0; x < 2; x++) {
            mtx2[y][x] = new Array()
            for (let z = 0; z < 2; z++) {
                mtx2[y][x][z] = 0
            }
        }
    }
    return mtx2
}
const rotationY = (mtx1) => {
    let mtx2 = makeArray()
    for (let y = 0; y < 2; y++) {
        for (let x = 0; x < mtx1[y].length; x++) {
            for (let z = 0; z < mtx1[y][x].length; z++) {
                mtx2[y][z][2 - x - 1] += mtx1[y][x][z]
            }
        }
    }
    return mtx2
}

const Rotate3D = (matrix) => {
    for (let yr = 0; yr < rotateY; yr++) {
        matrix = rotationY(matrix)
    }
    return matrix
}
const check = (field, matrix, dy, dx, dz) => {
    for (let y = 0; y < matrix.length; y++) {
        for (let x = 0; x < matrix.length; x++) {
            for (let z = 0; z < matrix.length; z++) {
                if (matrix[y][x][z]) {
                    if (dy + y >= FIELDY || dx + x >= FIELDX || dz + z >= FIELDZ) {
                        return false
                    }
                    if (field[dy + y][dx + x][dz + z]) {
                        return false
                    }
                }
            }
        }
    }
    return true
}
const put = (matrix, object, dy, dx, dz) => {
    object.name = "PUT"
    let c=Math.floor(Math.random()*(2**24))
    for (let i = 0; i < object.children.length; i++) {
        object.children[i].material = new THREE.MeshBasicMaterial({ color: c})
    }
    for (let y = 0; y < matrix.length; y++) {
        for (let x = 0; x < matrix[y].length; x++) {
            for (let z = 0; z < matrix[y][x].length; z++) {
                if (dy + y >= FIELDY || dx + x >= FIELDX || dz + z >= FIELDZ) continue
                if (matrix[y][x][z]) field[y + dy][x + dx][z + dz] = 1
            }
        }
    }
    object.tmp = [dy, dx, dz, matrix]
    if (rotplusY_Z[rotateY]) {
        dz += 1
    }
    if (rotplusY_X[rotateY]) {
        dx += 1
    }
    object.position.set(dx, dy, dz)
    scene.add(object)
    meshList.push(object)
}
const mmod = (a, b) => {
    if (a < 0) {
        a += b
    }
    return a % b
}
const animate = () => {
    if (BlockCount==Answer) {
        window.alert("クリア！")
    }
    raycaster.setFromCamera(mouse, camera);

    // その光線とぶつかったオブジェクトを得る
    const intersects = raycaster.intersectObjects(meshList);
    if (haveDrawBox && intersects.length == 0) {
        scene.remove(scene.children.filter((obj) => obj.name == "haveBox")[0])
        haveDrawBox = 0
    }
    if (intersects.length > 0) {
        for (let i = 0; i < intersects.length; i++) {
            if (intersects[i].object.name == "NODE") {
                let x = (intersects[i].object.position.x + NodeSize + Math.floor(BoxSize / 2)) / BoxSize
                let y = (intersects[i].object.position.y + NodeSize + Math.floor(BoxSize / 2)) / BoxSize
                let z = (intersects[i].object.position.z + NodeSize + Math.floor(BoxSize / 2)) / BoxSize
                if (!haveDrawBox) {
                    let obj = patarn[haveBox][haveBoxRev]
                    let mesh = obj[1].clone()
                    mesh.name = "haveBox"
                    mesh.mtx = obj[0]
                    mesh.position.set(x, y, z)
                    scene.add(mesh)
                    haveDrawBox = 1
                } else {
                    let mesh = scene.children.filter((obj) => obj.name == "haveBox")[0]
                    if (mesh.rotation.y != Math.PI / 2 * rotateY) {
                        if (!rotplusY_Z[mesh.rotation.y / (Math.PI / 2)]) {
                            mesh.position.z += rotplusY_Z[rotateY]
                        }
                        if ((rotplusY_Z[mesh.rotation.y / (Math.PI / 2)] && !rotplusY_Z[rotateY])) {
                            mesh.position.z -= 1
                        }
                        if (!rotplusY_X[mesh.rotation.y / (Math.PI / 2)]) {
                            mesh.position.x += rotplusY_X[rotateY]
                        }
                        if (rotplusY_X[mesh.rotation.y / (Math.PI / 2)] && !rotplusY_X[rotateY]) {
                            mesh.position.x -= 1
                        }
                        mesh.rotation.y = Math.PI / 2 * rotateY

                    }

                }

                if (clickFlg) {
                    let mesh = scene.children.filter((obj) => obj.name == "haveBox")[0]
                    let mtx = Rotate3D(mesh.mtx, y, x, z)
                    if (check(field, mtx, y, x, z)) {
                        BlockCount+=mesh.children.length
                        put(mtx, mesh.clone(), y, x, z)
                        console.log(scene.children)
                    }

                }
                clickFlg = 0
                break
            }
            //削除
            if (intersects[i].object.parent.name == "PUT" && clickFlg) {
                let target = intersects[i].object.parent
                let dy = target.tmp[0]
                let dx = target.tmp[1]
                let dz = target.tmp[2]
                let matrix = target.tmp[3]
                for (let y = 0; y < matrix.length; y++) {
                    for (let x = 0; x < matrix[y].length; x++) {
                        for (let z = 0; z < matrix[y][x].length; z++) {
                            if (dy + y >= FIELDY || dx + x >= FIELDX || dz + z >= FIELDZ) continue
                            if (matrix[y][x][z]) field[y + dy][x + dx][z + dz] = 0
                        }
                    }
                }
                meshList = meshList.filter((a) => a != target)
                BlockCount-=scene.children.filter((obj) => obj == target)[0].children.length
                scene.remove(scene.children.filter((obj) => obj == target)[0])
                clickFlg = 0
                break
            }
        }
    }
    clickFlg = 0
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

const init = () => {
    meshList = []
    const ALLSIZE = FIELDX * FIELDY * FIELDZ
    field = SetField()
    animate();

}
const onClickModule = () => {
    clickFlg = 1
}

const onKeyUp = (e) => {
    switch (e.code) {
        case 'ArrowRight':
            rotateY = mmod((rotateY-1), 4)
            break
        case 'ArrowLeft':
            rotateY = mmod((rotateY+1), 4)
            break
        case 'ArrowUp':
            haveBoxRev=(haveBoxRev+1)%2
            scene.remove(scene.children.filter((obj) => obj.name == "haveBox")[0])
            haveDrawBox = 0
            break
        case 'ArrowDown':
            haveBoxRev=(haveBoxRev+1)%2
            scene.remove(scene.children.filter((obj) => obj.name == "haveBox")[0])
            haveDrawBox = 0
            break
    }
}
window.addEventListener("DOMContentLoaded", init)
window.addEventListener("click", onClickModule)
document.addEventListener('keyup', onKeyUp)
btnWL.addEventListener('click', ()=>{
    haveBox="WL"
})
btnHL.addEventListener('click', ()=>{
    haveBox="HL"
})
btnHWL.addEventListener('click', ()=>{
    haveBox="HWL"
})
btnS.addEventListener('click', ()=>{
    haveBox="S"
})