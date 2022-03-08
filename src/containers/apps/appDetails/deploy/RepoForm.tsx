import { Col, Input, Row } from 'antd'
import React, { Component } from 'react'
import Utils from '../../../../utils/Utils'
import PasswordField from '../../../global/PasswordField'
import { RepoInfo } from '../../AppDefinition'

export default class RepoForm extends Component<{
    repoValues: RepoInfo
    updateRepoInfo: (newRepoInfo: RepoInfo) => void
}> {
    getPlaceHolder() {
        switch (this.props.repoValues.type) {
            case 'git':
                return {
                    repo: 'github.com/someone/something',
                    branch: 'master',
                    user: 'myemail@gmail.com',
                    password: 'githubpassword',
                }
            case 'fossil':
            default:
                return {
                    repo: 'https://www.fossil-scm.org',
                    branch: 'trunk',
                    user: 'whoami',
                    password: 'fossilpassword',
                }
        }
    }
    render() {
        const placeholders = this.getPlaceHolder()
        return (
            <div>
                <form action="/" autoComplete="off">
                    <Row gutter={20}>
                        <Col xs={{ span: 24 }} lg={{ span: 12 }}>
                            <Input
                                style={{ marginBottom: 20 }}
                                value={this.props.repoValues.repo}
                                addonBefore="Repository"
                                placeholder={placeholders.repo}
                                type="url"
                                spellCheck={false}
                                autoCorrect="off"
                                autoComplete="off"
                                autoCapitalize="off"
                                onChange={(e) => {
                                    const newObj = Utils.copyObject(
                                        this.props.repoValues
                                    )
                                    newObj.repo = e.target.value
                                    this.props.updateRepoInfo(newObj)
                                }}
                            />
                        </Col>
                        <Col xs={{ span: 24 }} lg={{ span: 12 }}>
                            <Input
                                style={{ marginBottom: 20 }}
                                value={this.props.repoValues.branch}
                                addonBefore={
                                    <span>Branch&nbsp;&nbsp;&nbsp;&nbsp;</span>
                                }
                                placeholder={placeholders.branch}
                                type="text"
                                spellCheck={false}
                                autoCorrect="off"
                                autoComplete="off"
                                autoCapitalize="off"
                                onChange={(e) => {
                                    const newObj = Utils.copyObject(
                                        this.props.repoValues
                                    )
                                    newObj.branch = e.target.value
                                    this.props.updateRepoInfo(newObj)
                                }}
                            />
                        </Col>
                        <Col
                            xs={{ span: 24 }}
                            lg={{ span: 12 }}
                            className={
                                this.props.repoValues.sshKey
                                    ? 'hide-on-demand'
                                    : ''
                            }
                        >
                            <Input
                                style={{ marginBottom: 20 }}
                                value={this.props.repoValues.user}
                                addonBefore={<span>Username&nbsp;</span>}
                                placeholder={placeholders.user}
                                type="email"
                                onChange={(e) => {
                                    const newObj = Utils.copyObject(
                                        this.props.repoValues
                                    )
                                    newObj.user = e.target.value
                                    this.props.updateRepoInfo(newObj)
                                }}
                            />
                        </Col>
                        <Col
                            xs={{ span: 24 }}
                            lg={{ span: 12 }}
                            className={
                                this.props.repoValues.sshKey
                                    ? 'hide-on-demand'
                                    : ''
                            }
                        >
                            <PasswordField
                                defaultValue={this.props.repoValues.password}
                                addonBefore="Password"
                                placeholder={placeholders.password}
                                onChange={(e) => {
                                    const newObj = Utils.copyObject(
                                        this.props.repoValues
                                    )
                                    newObj.password = e.target.value
                                    this.props.updateRepoInfo(newObj)
                                }}
                            />
                        </Col>

                        {this.props.repoValues.type == 'git' ? (
                            <Col span={24}>
                                <span>
                                    Or, instead of username/password, use SSH
                                    Key:
                                </span>
                                <Input.TextArea
                                    style={{ marginBottom: 20 }}
                                    rows={4}
                                    value={this.props.repoValues.sshKey}
                                    placeholder={
                                        '-----BEGIN RSA PRIVATE KEY-----\nAABBBCCC'
                                    }
                                    onChange={(e) => {
                                        const newObj = Utils.copyObject(
                                            this.props.repoValues
                                        )
                                        newObj.sshKey = e.target.value
                                        if (newObj.sshKey) {
                                            // Upon changing SSH key, we forcefully remove user/pass to inform the user that SSH will take priority
                                            newObj.password = ''
                                            newObj.user = ''
                                        }
                                        this.props.updateRepoInfo(newObj)
                                    }}
                                />
                            </Col>
                        ) : (
                            <Col span={24}>
                                <span>SSH is not supported right now ...</span>
                            </Col>
                        )}
                    </Row>
                </form>
            </div>
        )
    }
}
