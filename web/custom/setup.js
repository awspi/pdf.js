import {
  getApplication,
  getEditorDisplayController,
  getEditorManager,
  getEventBus
} from './utils.js';



let afterDocumentLoadedExecuted=false

function handleAnnotationEditorUIManager() {
  const properties = getApplication().pdfViewer._layerProperties;
  const manager = properties.annotationEditorUIManager;

  // 有的editor对象初始化完了之后，再经过一轮操作才会显示
  manager.hook.postInitialize=(editor)=>{
    editorManager.createEditorParameters(editor);
  }
}

function handleRenderMatchBoxCheck(params) {
  const editorManager=getEditorManager()
  const controller = getEditorDisplayController()
  const properties = getApplication().pdfViewer._layerProperties;
  const manager = properties.annotationEditorUIManager;

  // 保存到editorManager里面去
  editorManager.initEditorParameters(params, manager);
  controller.renderPreparedLayerAnnotations(editorManager.map);
}

function handleAnnotationEditorLayerRendered(e) {
  const editorManager=getEditorManager()
  const controller = getEditorDisplayController()
  console.log('#annotationeditorlayerrendered',)
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
}

export function setup() {
  const evBus = getEventBus();

  evBus._on('annotationeditoruimanager', handleAnnotationEditorUIManager);
  evBus._on('renderMatchBoxCheck', handleRenderMatchBoxCheck);
  evBus._on('annotationeditorlayerrendered', handleAnnotationEditorLayerRendered);
}
