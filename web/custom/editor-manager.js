export class EditorManager {

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
