import {BoxCheckEditor} from "../../src/display/editor/boxcheck.js";
import {getEditorManager, getUIManager, getViewer} from "./utils.js";

export class AnnotationEditorController {

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


