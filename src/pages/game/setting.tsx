import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { Layout, Typography, Form, InputNumber, Slider, Button, Card, Select, message, Tabs } from 'antd';

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

const SettingsApp = () => {
    const [form] = Form.useForm();

    useEffect(() => {
        // Load settings from localStorage
        const storedSettings = localStorage.getItem('FB_CONFIG');
        if (storedSettings) {
            form.setFieldsValue(JSON.parse(storedSettings));
        } else {
            // Defaults
            form.setFieldsValue({
                pipeSpeed: 2,
                pipeGap: 220,
                jumpHeight: 6, // Originally birdV = 6
                betOptions: [10, 20, 50, 100],
                gravity: 0.3
            });
        }
    }, [form]);

    const onFinish = (values: any) => {
        localStorage.setItem('FB_CONFIG', JSON.stringify(values));
        message.success('Game Settings Saved! Reflecting in game...');
    };

    return (
        <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
            <Header style={{ background: '#001529', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Title level={4} style={{ color: 'white', margin: 0 }}>FlappyAdmin</Title>
                <Button type="link" href="/" style={{ color: '#1890ff' }}>Go to Game</Button>
            </Header>
            <Content style={{ padding: '24px 50px' }}>
                <div style={{ maxWidth: 800, margin: '0 auto' }}>

                    <Card title="Game Configuration" bordered={false} style={{ marginBottom: 24, boxShadow: '0 1px 2px 0 rgba(0,0,0,0.03)' }}>
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={onFinish}
                            initialValues={{
                                pipeSpeed: 2,
                                pipeGap: 150,
                                jumpHeight: 6,
                                betOptions: [10, 20, 50, 100]
                            }}
                        >
                            <Tabs defaultActiveKey="1" items={[
                                {
                                    key: '1',
                                    label: 'Difficulty & Physics',
                                    children: (
                                        <>
                                            <Form.Item
                                                label="Pipe Move Speed (Difficulty)"
                                                name="pipeSpeed"
                                                extra="Higher = Faster Scrolling. Normal: 2. Hard: 4."
                                            >
                                                <Slider min={1} max={10} step={0.5} marks={{ 1: 'Slow', 2: 'Normal', 5: 'Fast', 10: 'Insane' }} />
                                            </Form.Item>

                                            <Form.Item
                                                label="Pipe Vertical Gap (Space for Bird)"
                                                name="pipeGap"
                                                extra="Lower = Harder. Normal: 220. Hard: 150."
                                            >
                                                <Slider min={100} max={300} reverse marks={{ 300: 'Easy', 150: 'Hard' }} />
                                            </Form.Item>

                                            <Form.Item
                                                label="Bird Jump Strength"
                                                name="jumpHeight"
                                                extra="Velocity applied on tap. Default: 6."
                                            >
                                                <InputNumber min={1} max={15} style={{ width: '100%' }} />
                                            </Form.Item>

                                            <Form.Item
                                                label="Gravity"
                                                name="gravity"
                                                extra="How fast bird falls. Default: 0.3."
                                            >
                                                <InputNumber min={0.1} max={1.0} step={0.1} style={{ width: '100%' }} />
                                            </Form.Item>
                                        </>
                                    )
                                },
                                {
                                    key: '2',
                                    label: 'Betting System',
                                    children: (
                                        <>
                                            <Form.Item
                                                label="Allowed Bet Amounts"
                                                name="betOptions"
                                                extra="Enter allowed bet values. Press Enter to add."
                                            >
                                                <Select
                                                    mode="tags"
                                                    style={{ width: '100%' }}
                                                    placeholder="e.g. 10, 20, 50"
                                                    tokenSeparators={[',']}
                                                />
                                            </Form.Item>
                                        </>
                                    )
                                }
                            ]} />

                            <Form.Item style={{ marginTop: 24 }}>
                                <Button type="primary" htmlType="submit" size="large" block>
                                    Save Configuration
                                </Button>
                            </Form.Item>
                        </Form>
                    </Card>
                </div>
            </Content>
            <Footer style={{ textAlign: 'center' }}>Flappy Bird Demo ©2025</Footer>
        </Layout>
    );
};

// Umi handles rendering so we just export default the component
export default SettingsApp;
