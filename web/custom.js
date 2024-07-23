import {BoxCheckEditor} from "../src/display/editor/boxcheck.js";

let afterDocumentLoadedExecuted=false

const getApplication = () => {
  return window.PDFViewerApplication;
};

function getEventBus() {
  return getApplication().eventBus;
}

function getUIManager() {
  return getApplication().pdfViewer._layerProperties.annotationEditorUIManager;
}

function getContainer() {
  return document.getElementById("viewerContainer");
}

function getViewer() {
  return document.getElementById("viewer");
}

function getEditorManager() {
  return window.editorManager;
}

function selectEditor(id) {
  const manager = getUIManager();
  let editor = null;
  if (!manager || !(editor = manager.getEditor(id))) {
    return;
  }
  manager.setSelected(editor, false)
}



class EditorManager {

  map = new Map();

  // 更新id的值
  initEditorParameters(params, ) {
    if (!params  || params.length === 0) {
      return;
    }
    let maxId = -1;
    for (const param of params) {
      if (!param.id) {
        continue;
      }
      this.map.set(param.id, param);
      let number = parseInt(param.id.replace("pdfjs_internal_editor_", ""));
      if (isNaN(number)) {
        continue;
      }
      if (number > maxId) {
        maxId = number;
      }
    }
    const uiManger=getUIManager()
    uiManger.setId(maxId + 1);
  }

  createEditorParameters(editor) {
    const exist = this.map.get(editor.id);
    console.log('#createEditorParameters',exist)
    if (exist) {
      return null;
    }
    // 只处理boxcheck
    const convertParams=(editor)=>{
      const params = {};
      params.pageIndex = editor.pageIndex;
      params.id = editor.id;
      params.x = editor.x;
      params.y = editor.y;
      params.width = editor.width;
      params.height = editor.height;
      params.isCentered = editor._initialOptions?.isCentered;
      params.name = editor.name;
      return params;
    }
    const params = convertParams(editor)
    if (!params) {
      console.log("转换失败，editor无法转换为相应参数");
      return null;
    }
    // createMarkingOperation(params.id);
    this.map.set(editor.id, params);
    return params;
  }

  removeEditorParameters(editor) {
    let params;
    if (!editor || !editor.id || !(params = this.map.get(editor.id))) {
      return null;
    }
    this.map.delete(editor.id);
  }
}

const editorManager = new EditorManager();

window.editorManager =editorManager

class EditorDisplayController {

  renderPreparedLayerAnnotations(params, layerIndex) {
    for (const [key, value] of params) {
      // 两种情况下渲染
      // 一种是 没有传入 layerIndex 按照当前加载的页来渲染
      // 一种是传入了layerIndex，那么就只渲染传入的layerIndex
      if ((!layerIndex || value.pageIndex == layerIndex ) && value.hidden != true) {
        this.show(key);
      }
    }
    const uiManager =getUIManager()
    const id = uiManager.waitToSelect;
    let editor = null;
    if(!id || (editor = uiManager.getEditor(id)) == null){
      return;
    }
    uiManager.waitToSelect = null;
    uiManager.setSelected(editor);
  }

  jump(id) {
    const em = getEditorManager();
    let params;
    if ((params = em.map.get(id)) == null) {
      return null;
    }

    const index = params.pageIndex;
    const y = params.y;
    const height = params.height;
    const container = getContainer();
    const viewer = getViewer();
    const nodes = viewer.childNodes;
    if (viewer.childNodes.length <= index) {
      return null;
    }
    const page = nodes[index];

    // 通过这个值可以滚动到当页
    const offsetTop = page.offsetTop;
    const pageHeight = page.scrollHeight;

    // 元素相对于页面的y值
    const eleY = y * pageHeight;

    // 通过这个值可以将注解滚动到顶部，toolbar高度不会变
    // 并且保证 元素高度 一半在screen内，一半在screen外
    let destY = offsetTop + eleY + height * pageHeight / 2;

    // 把批注滚动到最高处之后，还要回滚半个屏幕（实际上是可见部分）
    // 这样批注就在正中央了
    const scrollBackHeight = container.clientHeight / 2;
    destY = destY - scrollBackHeight;
    if(destY < 0){
      destY = 0;
    }
    container.scrollTo(0, destY);
    const editor = getUIManager().getEditor(id)
    if(editor){
      selectEditor(id);
    }else{
      getUIManager().waitToSelect = id;
    }
    return destY;
  }

  show(id) {
    const inUIManager = this.isInUIManager(id);
    const inParamMap = this.isInParamMap(id);

    // 已经展示了就不展示
    if (inUIManager) {
      return;
    }
    // 如果没有参数 也不展示
    if (!inParamMap) {
      return;
    }
    this.doShow(id);
  }

  hide(id) {
    const inUIManager = this.isInUIManager(id);
    // 已经不显示的就不管了
    if (!inUIManager) {
      return;
    }

    const manager = getUIManager();
    const editor = manager.getEditor(id);
    editor.remove(true);
    const eManager = getEditorManager();
    let params = eManager.map.get(id);
    if(params != null){
      params.hidden = true;
    }
  }

  remove(id, direct = false){
    const inUIManager = this.isInUIManager(id);
    // 已经不显示的就不管了
    if (!inUIManager) {
      return;
    }
    // 应该要从params里也删除掉
    const manager = getUIManager();
    const editor = manager.getEditor(id);
    editor.remove(direct);
    const eManager = getEditorManager();
    let params = eManager.map.get(id);
    if(params != null){
      params.hidden = true;
    }
  }

  doShow(id) {
    const um = getUIManager();
    const em = getEditorManager();

    // 没有则创建
    const source = em.map.get(id);
    const pageIndex = source.pageIndex;
    const layer = um.getLayer(pageIndex);

    if (!layer) {
      return;
    }

    // 可见状态
    source.hidden = false;

    const params = Object.assign({}, source);
    // 是否
    params.fromCommand = true;
    params.uiManager = um;
    params.parent = layer;

    let editor = null;

    switch (params.name) {
      case "boxCheckEditor":
        editor = new BoxCheckEditor(params);
        console.log('#doShow params:%o,editor:%o',params,editor)
        layer.add(editor);
        break;
    }
  }

  isInUIManager(id) {
    const manager = getUIManager();
    let editor = manager.getEditor(id);
    return editor != null;
  }

  isInParamMap(id) {
    const eManager = getEditorManager();
    let params = eManager.map.get(id);
    return params != null;
  }
}

const controller = new EditorDisplayController();
window.annotationEditorController = controller;



export const setupCustomCapabilities =()=>{
  const evBus=getEventBus()
  evBus._on('annotationeditoruimanager',function (){
    const properties = getApplication().pdfViewer._layerProperties;
    const manager = properties.annotationEditorUIManager;

    /**
     * 有的editor对象初始化完了之后，再经过一轮操作才会显示
     */
    manager.hook.postInitialize=(editor)=>{
      editorManager.createEditorParameters(editor);
    }


    const params =
      [
        {
          "pageIndex": 0,
          "id": "pdfjs_internal_editor_0",
          "x": 0.5101168529971456,
          "y": 0.14989098837209303,
          "width": 0.21895436979785968,
          "height": 0.13622559037238874,
          "name": "boxCheckEditor"
        }, {
          "pageIndex": 0,
          "id": "pdfjs_internal_editor_1",
          "x": 0.19494083016175073,
          "y": 0.32703488372093026,
          "width": 0.0927467300832342,
          "height": 0.17892824704813806,
          "name": "boxCheckEditor"
        }, {
          "pageIndex": 0,
          "id": "pdfjs_internal_editor_2",
          "x": 0.7908019148430067,
          "y": 0.36882267441860467,
          "width": 0.12009512485136742,
          "height": 0.12352406902815623,
          "name": "boxCheckEditor"
        }
      ]
    // 保存到editorManager里面去
    editorManager.initEditorParameters(params, manager);
    controller.renderPreparedLayerAnnotations(editorManager.map);
  })
  evBus._on('annotationeditorlayerrendered',function (e){
    // 这个代码只执行一次
    if (!afterDocumentLoadedExecuted) {
      afterDocumentLoadedExecuted = true;
      if (window.afterDocumentLoaded) {
        window.afterDocumentLoaded();
      }
    }
    // pageNumber要转换成layer的下标，要减1
    controller.renderPreparedLayerAnnotations(
      editorManager.map,
      e.pageNumber - 1
    );
  })
}
