import { RocketOutlined, InfoCircleOutlined, SettingOutlined } from '@ant-design/icons'
import { Modal, Button, Col, Input, message, Checkbox, Row, Tabs, Tooltip, Select } from 'antd'
import deepEqual from 'deep-equal'
import React from 'react'
import DomUtils from '../../../../utils/DomUtils'
import Toaster from '../../../../utils/Toaster'
import Utils from '../../../../utils/Utils'
import ApiComponent from '../../../global/ApiComponent'
import NewTabLink from '../../../global/NewTabLink'
import { IAppDef, IAppVersion, RepoType, RepoInfo } from '../../AppDefinition'
import { AppDetailsTabProps } from '../AppDetails'
import AppLogsView from './AppLogsView'
import AppVersionTable from './AppVersionTable'
import BuildLogsView from './BuildLogsView'
import RepoForm from './RepoForm'
import TarUploader from './TarUploader'
import UploaderPlainTextCaptainDefinition from './UploaderPlainTextCaptainDefinition'
import UploaderPlainTextDockerfile from './UploaderPlainTextDockerfile'
import UploaderPlainTextImageName from './UploaderPlainTextImageName'
const TabPane = Tabs.TabPane

const DEPLOY_METHOD_1 = 'DEPLOY_METHOD_1'
const DEPLOY_METHOD_2 = 'DEPLOY_METHOD_2'
const DEPLOY_METHOD_3 = 'DEPLOY_METHOD_3'
const DEPLOY_METHOD_4 = 'DEPLOY_METHOD_4'
const DEPLOY_METHOD_5 = 'DEPLOY_METHOD_5'
const DEPLOY_METHOD_6 = 'DEPLOY_METHOD_6'

export default class Deployment extends ApiComponent<
    AppDetailsTabProps,
    {
        dummyVar: undefined
        forceEditDeployOptions: boolean
        buildLogRecreationId: string
        activeTabKey: string
        updatedVersions:
            | { versions: IAppVersion[]; deployedVersion: number }
            | undefined
    }
> {
    initRepoInfo: RepoInfo
    needRepoType: RepoType
    dockerFileContent: string

    constructor(props: AppDetailsTabProps) {
        super(props)
        this.state = {
            dummyVar: undefined,
            forceEditDeployOptions: false,
            activeTabKey: DEPLOY_METHOD_4,
            updatedVersions: undefined,
            buildLogRecreationId: '',
        }

        const { appPushWebhook } = props.apiData.appDefinition
        this.initRepoInfo = appPushWebhook
            ? { ...appPushWebhook.repoInfo }
            : {
                  type: RepoType.git,
                  user: '',
                  password: '',
                  branch: '',
                  sshKey: '',
                  repo: '',
              }
        this.needRepoType = this.initRepoInfo.type;
        this.dockerFileContent = ''
    }

    onUploadSuccess() {
        message.info('Build has started')
        this.setState({ buildLogRecreationId: `${new Date().getTime()}` })
        DomUtils.scrollToTopBar()
    }

    onAppBuildFinished() {
        const self = this
        self.apiManager
            .getAllApps()
            .then(function (data) {
                const appDefs = data.appDefinitions as IAppDef[]
                for (let index = 0; index < appDefs.length; index++) {
                    const element = appDefs[index]
                    if (
                        element.appName ===
                        self.props.apiData.appDefinition.appName
                    ) {
                        return Utils.copyObject(element)
                    }
                }
                throw new Error('App not found!')
            })
            .then(function (app) {
                self.setState({
                    updatedVersions: {
                        deployedVersion: app.deployedVersion,
                        versions: app.versions,
                    },
                })
            })
            .catch(Toaster.createCatcher())
    }

    onVersionSelected(version: IAppVersion) {
        const self = this
        self.dockerFileContent = version.deployedDockerFile ? `${version.deployedDockerFile}` : ''
        if (version.deployedDockerFile)
            self.setState({ activeTabKey: DEPLOY_METHOD_4 })
        self.forceUpdate()
    }

    onVersionRollbackRequested(version: IAppVersion) {
        const self = this
        self.apiManager
            .uploadCaptainDefinitionContent(
                self.props.apiData.appDefinition.appName!,
                {
                    schemaVersion: 2,
                    // We should use imageName, but since imageName does not report build failure (since there is no build!)
                    // If we use that, and the image is not available, the service will not work.
                    dockerfileLines: [`FROM ${version.deployedImageName}`],
                },
                version.vcsHash || '',
                true
            )
            .then(function () {
                self.onUploadSuccess()
            })
            .catch(Toaster.createCatcher())
    }

    render() {
        const self = this
        const app = this.props.apiData.appDefinition
        const hasPushToken =
            app.appPushWebhook && app.appPushWebhook.pushWebhookToken

        const repoInfoDef = {
          type: this.needRepoType,
          user: '',
          password: '',
          branch: '',
          sshKey: '',
          repo: '',
        }
        var repoInfo = app.appPushWebhook
            ? app.appPushWebhook.repoInfo
            : repoInfoDef
        if (this.needRepoType != repoInfo.type) {
          repoInfo = repoInfoDef
        }
 
        const webhookPushUrlRelativePath = hasPushToken
            ? `/user/apps/webhooks/triggerbuild?namespace=captain&token=${
                  app.appPushWebhook!.pushWebhookToken
              }`
            : ''

        const webhookPushUrlFullPath = `${window.location.protocol}//${this.props.apiData.captainSubDomain}.${this.props.apiData.rootDomain}/api/v2${webhookPushUrlRelativePath}`
        const dockerFileContent = this.dockerFileContent
        return (
            <div>
                <BuildLogsView
                    onAppBuildFinished={() => self.onAppBuildFinished()}
                    appName={app.appName!}
                    buildLogRecreationId={self.state.buildLogRecreationId}
                    key={`${app.appName!}-${self.state.buildLogRecreationId}`}
                />
                <div style={{ height: 20 }} />
                <hr />

                <AppLogsView
                    appName={app.appName!}
                    key={app.appName! + '-LogsView'}
                />
                
                <div style={{ height: 20 }} />

                <AppVersionTable
                    isMobile={this.props.isMobile}
                    onVersionRollbackRequested={(versionToRevert) =>
                        self.onVersionRollbackRequested(versionToRevert)
                    }
                    onVersionSelected={(version) =>
                        self.onVersionSelected(version)
                    }
                    versions={
                        self.state.updatedVersions
                            ? self.state.updatedVersions.versions
                            : app.versions
                    }
                    deployedVersion={
                        self.state.updatedVersions
                            ? self.state.updatedVersions.deployedVersion
                            : app.deployedVersion
                    }
                />

                <hr />
                

                <Tabs
                    activeKey={self.state.activeTabKey}
                    onChange={(key) => {
                        self.setState({ activeTabKey: key })
                    }}
                    style={{ minHeight: '300px', margin: 20 }}
                    tabPosition={ this.props.isMobile ? 'top' : 'left' }
                >
                    <TabPane
                        tab={
                            <span className="unselectable-span">
                                <RocketOutlined /> 
                                Official CLI
                            </span>
                        }
                        key={DEPLOY_METHOD_1}
                        style={{ padding: this.props.isMobile ? 10 : 30 }}
                    >
        
                        <Row
                            justify="start"
                            style={{ marginTop: this.props.isMobile ? 15 : 0 }}
                        >
                            <p>
                                Use CLI deploy command. This is the easiest method as it
                                only requires a simply command like{' '}
                                <code>caprover deploy</code>. Read more about it in{' '}
                                <NewTabLink url="https://caprover.com/docs/get-started.html#step-4-deploy-the-test-app">
                                    the docs
                                </NewTabLink>
                                . If you're using CI/CD to run <code>caprover deploy</code>{' '}
                                and you do not wish to use your password, you can use{' '}
                                <NewTabLink url="https://caprover.com/docs/ci-cd-integration.html#app-tokens">
                                    app-specific tokens
                                </NewTabLink>
                                .
                            </p>

                            <Col flex="0">
                                <Button
                                    style={{
                                        margin: 5,
                                    }}
                                    block={this.props.isMobile}
                                    onClick={() => {
                                        const newApiData = Utils.copyObject(
                                            this.props.apiData
                                        )
                                        let tokenConfig =
                                            newApiData.appDefinition
                                                .appDeployTokenConfig
                                        if (!tokenConfig) {
                                            tokenConfig = {
                                                enabled: false,
                                            }
                                        }
                                        tokenConfig.enabled = !tokenConfig.enabled
                                        newApiData.appDefinition.appDeployTokenConfig =
                                            tokenConfig
                                        self.props.updateApiData(newApiData)
                                        // This is a hack! Find a better way!
                                        // We need this delay, otherwise the new state will not be used by onUpdateConfigAndSave
                                        setTimeout(
                                            self.props.onUpdateConfigAndSave,
                                            100
                                        )
                                    }}
                                >
                                    {app.appDeployTokenConfig?.enabled
                                        ? 'Disable App Token'
                                        : 'Enable App Token'}
                                </Button>
                            </Col>{' '}
                            <Col flex="auto">
                                <Input
                                    onFocus={(e) => {
                                        if (
                                            !!app.appDeployTokenConfig?.appDeployToken
                                        ) {
                                            e.target.select()
                                            document.execCommand('copy')
                                            message.info('Copied to clipboard!')
                                        }
                                    }}
                                    style={{
                                        margin: 5,
                                    }}
                                    className="code-input"
                                    readOnly={true}
                                    disabled={!app.appDeployTokenConfig?.appDeployToken}
                                    value={
                                        app.appDeployTokenConfig?.enabled
                                            ? app.appDeployTokenConfig?.appDeployToken
                                            : '** Enable App Token to generate a random app token **'
                                    }
                                />
                            </Col>
                        </Row>
                    </TabPane>
               
                    <TabPane
                        tab={
                            <span className="unselectable-span">
                                <RocketOutlined /> 
                                Tarball
                            </span>
                        }
                        key={DEPLOY_METHOD_2}
                        style={{ padding: this.props.isMobile ? 10 : 30 }}
                    >
                        <p>
                            You can simply create a tarball (<code>.tar</code>) of your
                            project and upload it here via upload button.
                        </p>

                        <TarUploader
                            onUploadSucceeded={() => self.onUploadSuccess()}
                            appName={app.appName!}
                        />
                    </TabPane>

                    <TabPane
                        tab={
                            <span className="unselectable-span">
                                <RocketOutlined /> 
                                SCM
                            </span>
                        }
                        key={DEPLOY_METHOD_3}
                        style={{ padding: this.props.isMobile ? 10 : 30 }}
                    >
                        <span> Deploy from </span>
                        <Select 
                            value={repoInfo.type}
                            style={{ width: 100 }} 
                            onChange={(v) => {
                                Modal.confirm({
                                title: 'Change the VCS',
                                content: (
                                    <div>
                                        <p>
                                            You will move on {v} version control, <br/>
                                            and lost any previous parameters set...
                                        </p>
                                        <p>
                                            Are you sure ?
                                        </p>
                                    </div>
                                ),
                                onOk() {
                                    self.needRepoType = v as RepoType
                                    self.forceUpdate()
                                },
                                onCancel() {
                                    self.forceUpdate()
                                }
                                })
                            }}>
                            <Select.Option value="git">git</Select.Option>
                            <Select.Option value="fossil">fossil</Select.Option>
                        </Select>
                            
                 
                        <p>
                            Enter your repository information in the form and save. Then
                            copy the URL in the box as a webhook on Github, Bitbucket,
                            Gitlab or as afterhook. Once you push a commit, CapRover starts a
                            new build.
                            <br />
                        </p>
                        <Row>
                            <Input
                                onFocus={(e) => {
                                    if (hasPushToken) {
                                        e.target.select()
                                        document.execCommand('copy')
                                        message.info('Copied to clipboard!')
                                    }
                                }}
                                className="code-input"
                                readOnly={true}
                                disabled={!hasPushToken}
                                value={
                                    hasPushToken
                                        ? webhookPushUrlFullPath
                                        : '** Add repo info and save for this webhook to appear **'
                                }
                            />
                        </Row>
                        <br />
                        <RepoForm 
                            repoValues={repoInfo}
                            updateRepoInfo={(newRepo) => {
                                const newApiData = Utils.copyObject(this.props.apiData)
                                if (newApiData.appDefinition.appPushWebhook) {
                                    newApiData.appDefinition.appPushWebhook.repoInfo =
                                        Utils.copyObject(newRepo)
                                } else {
                                    newApiData.appDefinition.appPushWebhook = {
                                        repoInfo: Utils.copyObject(newRepo),
                                    }
                                }
                                this.props.updateApiData(newApiData)
                            }}
                        />
                        <Row
                            justify="end"
                            style={{ marginTop: this.props.isMobile ? 15 : 0 }}

                        >
                            <Button
                                disabled={!hasPushToken}
                                style={{ marginRight: this.props.isMobile ? 0 : 10 }}
                                block={this.props.isMobile}
                                onClick={() => {
                                    self.apiManager
                                        .forceBuild(webhookPushUrlRelativePath)
                                        .then(function () {
                                            self.onUploadSuccess()
                                        })
                                        .catch(Toaster.createCatcher())
                                }}
                            >
                                Force Build
                            </Button>
                            <Button
                                disabled={deepEqual(repoInfo, self.initRepoInfo)}
                                type="primary"
                                style={{ marginTop: this.props.isMobile ? 15 : 0 }}
                                block={this.props.isMobile}
                                onClick={() => self.props.onUpdateConfigAndSave()}
                            >
                                Save &amp; Update
                            </Button>
                        </Row>

                    </TabPane>

                                   
                    <TabPane
                        tab={
                            <span className="unselectable-span">
                                <RocketOutlined /> 
                                Dockerfile
                            </span>
                        }
                        key={DEPLOY_METHOD_4}
                        style={{ padding: this.props.isMobile ? 10 : 30 }}
                    >
                        <UploaderPlainTextDockerfile
                            appName={app.appName!}
                            text={dockerFileContent}
                            onUploadSucceeded={() => self.onUploadSuccess()}
                        />
                    </TabPane>

        
                    <TabPane
                        tab={
                            <span className="unselectable-span">
                                <RocketOutlined /> 
                                captain-definition
                            </span>
                        }
                        key={DEPLOY_METHOD_5}
                        style={{ padding: this.props.isMobile ? 10 : 30 }}
                    >
                        <UploaderPlainTextCaptainDefinition
                            appName={app.appName!}
                            onUploadSucceeded={() => self.onUploadSuccess()}
                        />
                    </TabPane>

                    <TabPane
                        tab={
                            <span className="unselectable-span">
                                <RocketOutlined /> 
                                Image Name
                            </span>
                        }
                        key={DEPLOY_METHOD_6}
                        style={{ padding: this.props.isMobile ? 10 : 30 }}
                    >
                        <UploaderPlainTextImageName
                            appName={app.appName!}
                            onUploadSucceeded={() => self.onUploadSuccess()}
                        />
                    </TabPane>

                </Tabs>
              
                <hr />
                <div style={{ height: 20 }} />
                <h3>
                    <SettingOutlined /> Deployment options
                </h3>
                <div style={{ margin: 20 }}>
                    <Row>
                        <Col
                            xs={{ span: 24 }}
                            lg={{ span: 6 }}
                            style={{ minWidth: this.props.isMobile ? '100%' : 400 }}
                        >
                            {this.props.isMobile &&
                                'captain-definition Relative Path'}
                            <Input
                                addonBefore={
                                    !this.props.isMobile &&
                                    'captain-definition Relative Path'
                                }
                                type="text"
                                defaultValue={
                                    app.captainDefinitionRelativeFilePath + ''
                                }
                                disabled={
                                    !this.state.forceEditDeployOptions
                                }
                                onChange={(e) => {
                                    const newApiData = Utils.copyObject(
                                        this.props.apiData
                                    )
                                    newApiData.appDefinition.captainDefinitionRelativeFilePath =
                                        e.target.value
                                    this.props.updateApiData(newApiData)
                                }}
                            />
                        </Col>
                        <Col>
                            <span
                                style={{
                                    marginLeft: 15
                                }}
                            >
                                <Tooltip title="You shouldn't need to change this path unless you have a repository with multiple captain-definition files (mono repos). Read docs for captain definition before editing this">
                                    <InfoCircleOutlined/>
                                </Tooltip>
                            </span>
                        </Col>
                    </Row>
                    <div style={{ height: 10 }} />
                    <Row>
                        <Col
                            xs={{ span: 24 }}
                            lg={{ span: 6 }}
                            style={{ minWidth: this.props.isMobile ? '100%' : 400 }}
                        >
                            <div
                                style={{
                                    paddingLeft: this.props.isMobile ? 0 : 6,
                                    marginTop: this.props.isMobile ? 8 : 0,
                                }}
                            >
                                {this.props.isMobile &&
                                    'Build Without Cache'}
                                    
                                <Checkbox
                                    checked={app.buildNoCache}
                                    disabled={
                                        !this.state.forceEditDeployOptions
                                    }
                                    onChange={(e) => {
                                        const newApiData = Utils.copyObject(
                                            this.props.apiData
                                        )
                                        newApiData.appDefinition.buildNoCache = 
                                            e.target.checked
                                        this.props.updateApiData(newApiData)
                                    }}
                                >
                                    {!this.props.isMobile &&
                                    'Build Without Cache'}
                                </Checkbox>
                                <span
                                    style={{
                                        marginLeft: 10
                                    }}
                                >
                                    <Tooltip title="Do not use the docker cache if the deployment build a new image">
                                        <InfoCircleOutlined/>
                                    </Tooltip>
                                </span>
                            </div>
                        </Col>
                    </Row>
                    <div style={{ height: 20 }} />
                    <Row justify="end">
                        <Col >

                            <Tooltip title="Be sure of what you do if you decide to edit those deployment options !!">
                                <Button
                                    type="default"
                                    block={this.props.isMobile}
                                    disabled={
                                        this.state
                                            .forceEditDeployOptions
                                    }
                                    onClick={() =>
                                        this.setState({
                                            forceEditDeployOptions:
                                                true,
                                        })
                                    }
                                >
                                    Edit
                                </Button>
                            </Tooltip>
                            <Button
                                style={{
                                    marginLeft: this.props.isMobile ? 0 : 20,
                                    marginTop: this.props.isMobile ? 8 : 0,
                                }}
                                block={this.props.isMobile}
                                disabled={
                                    !this.state
                                        .forceEditDeployOptions
                                }
                                type="primary"
                                onClick={() =>
                                    self.props.onUpdateConfigAndSave()
                                }
                            >
                                Save &amp; Update
                            </Button>
                            
                        </Col>
                    </Row>
                </div>
            </div>
        )
    }
}


