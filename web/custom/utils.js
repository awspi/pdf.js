
export const getApplication = () => {
  return window.PDFViewerApplication;
};

export function getEventBus() {
  return getApplication().eventBus;
}

export function getUIManager() {
  return getApplication().pdfViewer._layerProperties.annotationEditorUIManager;
}

export function getContainer() {
  return document.getElementById("viewerContainer");
}

export function getViewer() {
  return document.getElementById("viewer");
}

export  function getEditorManager() {
  return window.editorManager;
}

export  function getEditorDisplayController(){
  return window.annotationEditorController
}


export function selectEditor(id) {
  const manager = getUIManager();
  let editor = null;
  if (!manager || !(editor = manager.getEditor(id))) {
    return;
  }
  manager.setSelected(editor, false)
}


