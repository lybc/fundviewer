<style scoped>
.layout {
  border: 1px solid #d7dde4;
  background: #f5f7f9;
  position: relative;
  border-radius: 4px;
  overflow: hidden;
}
.layout-logo {
  width: 100px;
  height: 30px;
  /* background: #5b6270; */
  border-radius: 3px;
  float: left;
  position: relative;
  top: 15px;
  left: 20px;
}
.layout-nav {
  width: 420px;
  margin: 0 auto;
  margin-left: 20px;
}
.layout-footer-center {
  text-align: center;
}

.logo {
  color: #d7dde4;
}
</style>
<template>
  <div class="layout">
    <Layout>
      <Header>
        <h2 class="logo">基王争霸，冲冲冲！！</h2>
      </Header>
      <Content :style="{padding: '0 50px'}">
        <Row :style="{margin: '10px 0 0 0'}">
          <Alert type="warning">录入的基金数据保存在浏览器，如果更换电脑或浏览器需要重新录入</Alert>
        </Row>

        <Row :style="{margin: '10px 0'}">
          <Input
            v-model="codes"
            :autosize="{minRows: 2,maxRows: 5}"
            placeholder="请输入你持有的基金代码，多个用逗号分隔，并按回车键确认。如：000934,519736"
            v-on:on-enter="onEnter"
          />
        </Row>

        <Row :style="{margin: '10px 0'}">
          <Col span="2">
            <Button icon="ios-refresh" @click="updateAll()">刷新所有</Button>
          </Col>

          <Col span="6">
            <ButtonGroup>
              <Button type="primary" ghost @click="refreshAll">
                <Icon type="ios-pulse-outline" /> 全部
              </Button>
              <Button type="error" ghost @click="filterJz(1)">
                <Icon type="ios-trending-up" /> 只看涨幅
              </Button>
              <Button type="success" ghost @click="filterJz(2)">
                <Icon type="ios-trending-down" /> 只看跌幅
              </Button>
            </ButtonGroup>
          </Col>
        </Row>

        <Row>
          <Card>
            <div style="min-height: 200px;">
              <Table
                :loading="loading"
                size="small"
                stripe
                :columns="tableHeader"
                :data="displayData"
              >
                <template slot-scope="{ row }" slot="expect_up_down">
                  <Tag
                    v-if="parseFloat(row.expect_up_down) >= 0"
                    color="red"
                  >+{{ row.expect_up_down }}%</Tag>
                  <Tag
                    v-if="parseFloat(row.expect_up_down) < 0"
                    color="green"
                  >{{ row.expect_up_down }}%</Tag>
                </template>

                <template slot-scope="{ row }" slot="action">
                  <Button
                    size="default"
                    icon="ios-trash-outline"
                    type="error"
                    @click="remove(row.code)"
                  >删除</Button>
                </template>
              </Table>
            </div>
          </Card>
        </Row>
      </Content>
      <Footer class="layout-footer-center">2020 &copy; Power by Lybc</Footer>
    </Layout>
  </div>
</template>
<script>
export default {
  data() {
    return {
      loading: false,
      codes: "",
      mode: 0, // 控制筛选项
      statistics: {
        upCount: 0,
        downCount: 0,
      },
      tableHeader: [
        {
          title: "代码",
          key: "code",
        },
        {
          title: "名称",
          key: "name",
        },
        {
          title: "净值日期",
          key: "jz_date",
        },
        {
          title: "当日净值",
          key: "daily_jz",
        },
        {
          title: "估算净值",
          key: "expect_jz",
        },
        {
          title: "估算涨跌",
          slot: "expect_up_down",
        },
        {
          title: "估值时间",
          key: "expect_date",
        },
        {
          title: "操作",
          slot: "action",
          width: 120,
        },
      ],

      displayData: [],
    };
  },
  mounted: function () {
    this.updateAll();
  },
  methods: {
    filterJz(type) {
      let data = localStorage.getItem("funds");
      data = JSON.parse(data);
      let items = [];
      for (const code in data) {
        const upDown = parseFloat(data[code]["expect_up_down"]);
        switch (type) {
          case 1:
            if (parseFloat(data[code]["expect_up_down"]) >= 0) {
              items.push(data[code]);
            }
            break;
          case 2:
            if (parseFloat(data[code]["expect_up_down"]) < 0) {
              items.push(data[code]);
            }
            break;
        }
      }
      this.displayData = items;
    },

    onEnter(event) {
      if (this.codes.length <= 0) {
        return;
      }

      if (this.codes.indexOf("，") != -1) {
        this.$Message.error("检测到包含中文逗号，请使用英文逗号分隔");
        return;
      }

      const codes = this.codes.split(",");

      codes.forEach((code) => {
        this.update(code.trim());
      });

      this.refreshAll();
    },

    remove(code) {
      let data = localStorage.getItem("funds");
      data = JSON.parse(data);
      delete data[code];
      localStorage.setItem("funds", JSON.stringify(data));
      this.refreshAll();
    },

    refreshAll() {
      let data = localStorage.getItem("funds");
      data = JSON.parse(data);
      this.displayData = [];
      for (var code in data) {
        this.displayData.push(data[code]);
      }
    },

    async updateAll() {
      let data = localStorage.getItem("funds");
      data = JSON.parse(data);
      this.loading = true;
      for (var code in data) {
        await this.update(code);
      }
      this.loading = false;
    },

    update(code) {
      const url = `http://fund.lybc.site/api/js/${code}.js`;
      return this.$http.get(url).then((response) => {
        let data = localStorage.getItem("funds");
        if (data && data.length > 0) {
          data = JSON.parse(data);
        } else {
          data = {};
        }
        let item = {
          code: "",
          name: "",
          jz_date: "",
          daily_jz: "",
          expect_jz: "",
          expect_up_down: "",
          expect_date: "",
        };

        if (response.status == 200 && response.data.length > 0) {
          const result = response.data
            .replace("jsonpgz(", "")
            .replace(");", "");
          const json = JSON.parse(result);
          item.code = json.fundcode;
          item.name = json.name;
          item.jz_date = json.jzrq;
          item.daily_jz = json.dwjz;
          item.expect_jz = json.gsz;
          (item.expect_up_down = json.gszzl), (item.expect_date = json.gztime);
        } else {
          item.name = "查无此基";
        }
        data[item.code] = item;
        localStorage.setItem("funds", JSON.stringify(data));
        this.refreshAll();
      });
    },
  },
};
</script>