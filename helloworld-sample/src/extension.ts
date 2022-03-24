/* eslint-disable no-mixed-spaces-and-tabs */
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "helloworld-sample" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('extension.helloWorld', () => {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World!');
	});
	const extension = vscode.extensions.getExtension("ms-python.python");
  if (extension) {
    if (!extension.isActive) {
      await extension.activate();
    }
    const api: IProposedExtensionAPI =
      extension.exports as IProposedExtensionAPI;
    if (api.environment) {
      api.environment.onDidEnvironmentsChanged(
        onEnvironmentsChanged.bind(undefined, api),
        undefined,
        context.subscriptions
      );
      void api.environment.refreshEnvironment();
    }
  }

	context.subscriptions.push(disposable);
}

function onEnvironmentsChanged(api: IProposedExtensionAPI) {
	api.environment.getActiveEnvironmentPath(undefined).then((a) => {
		api.environment.getEnvironmentPaths().then(async (p) => {
		console.log(
		`Environment list changed. Active is ${JSON.stringify(
			a
	)}. \n${JSON.stringify(p, undefined, " ")}`
		);
		if (p) {
		  p.forEach(async (t) => {
			const details = await api.environment.getEnvironmentDetails(t.path);
			console.log(
			  `Environment details for ${t.path} are ${JSON.stringify(
				details,
				undefined,
				" "
			  )}`
			);
		  });
		}
	  });
	});
  }
  
export interface IProposedExtensionAPI {
    environment: {
        /**
         * Returns the path to the python binary selected by the user or as in the settings.
         * This is just the path to the python binary, this does not provide activation or any
         * other activation command. The `resource` if provided will be used to determine the
         * python binary in a multi-root scenario. If resource is `undefined` then the API
         * returns what ever is set for the workspace.
         * @param resource : Uri of a file or workspace
         */
        getActiveEnvironmentPath(resource?: vscode.Uri | undefined): Promise<EnvPathType | undefined>;
        /**
         * Returns details for the given interpreter. Details such as absolute interpreter path,
         * version, type (conda, pyenv, etc). Metadata such as `sysPrefix` can be found under
         * metadata field.
         * @param path : Full path to environment folder or interpreter whose details you need.
         * @param options : [optional]
         *     * useCache : When true, cache is checked first for any data, returns even if there
         *                  is partial data.
         */
        getEnvironmentDetails(
            path: string,
            options?: EnvironmentDetailsOptions,
        ): Promise<EnvironmentDetails | undefined>;
        /**
         * Returns paths to environments that uniquely identifies an environment found by the extension
         * at the time of calling. This API will *not* trigger a refresh. If a refresh is going on it
         * will *not* wait for the refresh to finish. This will return what is known so far. To get
         * complete list `await` on promise returned by `getRefreshPromise()`.
         *
         * Virtual environments lacking an interpreter are identified by environment folder paths,
         * whereas other envs can be identified using interpreter path.
         */
        getEnvironmentPaths(): Promise<EnvPathType[] | undefined>;
        /**
         * Sets the active environment path for the python extension for the resource. Configuration target
         * will always be the workspace folder.
         * @param path : Full path to environment folder or interpreter to set.
         * @param resource : [optional] Uri of a file ro workspace to scope to a particular workspace
         *                   folder.
         */
        setActiveEnvironment(path: string, resource?: vscode.Uri | undefined): Promise<void>;
        /**
         * This API will re-trigger environment discovery. Extensions can wait on the returned
         * promise to get the updated environment list. If there is a refresh already going on
         * then it returns the promise for that refresh.
         * @param options : [optional]
         *     * clearCache : When true, this will clear the cache before environment refresh
         *                    is triggered.
         */
        refreshEnvironment(options?: RefreshEnvironmentsOptions): Promise<EnvPathType[] | undefined>;
        /**
         * Returns a promise for the ongoing refresh. Returns `undefined` if there are no active
         * refreshes going on.
         */
        getRefreshPromise(): Promise<void> | undefined;
        /**
         * This event is triggered when the known environment list changes, like when a environment
         * is found, existing environment is removed, or some details changed on an environment.
         */
        onDidEnvironmentsChanged: vscode.Event<EnvironmentsChangedParams[]>;
        /**
         * This event is triggered when the active environment changes.
         */
        onDidActiveEnvironmentChanged: vscode.Event<ActiveEnvironmentChangedParams>;
    };
}
export interface EnvPathType {
    /**
     * Path to environment folder or path to interpreter that uniquely identifies an environment.
     * Virtual environments lacking an interpreter are identified by environment folder paths,
     * whereas other envs can be identified using interpreter path.
     */
    path: string;
    pathType: 'envFolderPath' | 'interpreterPath';
}
export interface EnvironmentDetailsOptions {
    useCache: boolean;
}

export interface EnvironmentDetails {
    interpreterPath: string;
    envFolderPath?: string;
    version: string[];
    environmentType: PythonEnvKind[];
    metadata: Record<string, unknown>;
}

export interface EnvironmentsChangedParams {
    /**
     * Path to environment folder or path to interpreter that uniquely identifies an environment.
     * Virtual environments lacking an interpreter are identified by environment folder paths,
     * whereas other envs can be identified using interpreter path.
     */
    path?: string;
    type: 'add' | 'remove' | 'update' | 'clear-all';
}

export interface ActiveEnvironmentChangedParams {
    /**
     * Path to environment folder or path to interpreter that uniquely identifies an environment.
     * Virtual environments lacking an interpreter are identified by environment folder paths,
     * whereas other envs can be identified using interpreter path.
     */
    path: string;
    resource?: vscode.Uri;
}

export interface RefreshEnvironmentsOptions {
    clearCache?: boolean;
}

export enum PythonEnvKind {
    Unknown = 'unknown',
    // "global"
    System = 'global-system',
    MacDefault = 'global-mac-default',
    WindowsStore = 'global-windows-store',
    Pyenv = 'global-pyenv',
    CondaBase = 'global-conda-base',
    Poetry = 'global-poetry',
    Custom = 'global-custom',
    OtherGlobal = 'global-other',
    // "virtual"
    Venv = 'virt-venv',
    VirtualEnv = 'virt-virtualenv',
    VirtualEnvWrapper = 'virt-virtualenvwrapper',
    Pipenv = 'virt-pipenv',
    Conda = 'virt-conda',
    OtherVirtual = 'virt-other',
}