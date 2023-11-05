import * as vscode from 'vscode';
import * as decorator from './decorator';


export function activate(context: vscode.ExtensionContext) {

    console.log('md-checkbox-highlight is activated');

    activateTodoHighlightExt(context);

}

function activateTodoHighlightExt(context: vscode.ExtensionContext) {
    decorator.activate(context);
}

export function deactivate() { }
