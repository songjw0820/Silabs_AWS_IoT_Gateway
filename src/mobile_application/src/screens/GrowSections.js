import React, { Component } from 'react';
import {
  RefreshControl, StyleSheet, Text, View, FlatList, ActivityIndicator,
  TouchableOpacity, ScrollView
} from 'react-native';
import * as Constant from '../Constant';
import { connect } from 'react-redux';
import { getGrowSections } from '../store/actions/rootActions';
import { debug } from './../../app.json';
import { SearchBar } from 'react-native-elements';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Navigation } from 'react-native-navigation';

class GrowSections extends Component {

  static get options() {
    return Constant.DEFAULT_NAVIGATOR_STYLE;
  }
  growAreaId = null;
  visible = false;

  constructor(props) {
    super(props);
    Navigation.events().bindComponent(this);
    this.state = {
      refreshing: false
    };
    if (this.props.selectedGrowArea) {
      this.growAreaId = this.props.selectedGrowArea.id;
    }
  }

  componentDidAppear() {
    this.visible = true;
    this._onRefresh();
    this.forceUpdate();
    let growAreaId = this.growAreaId;
    if ((growAreaId ? (!this.props.growsectionsByGrowAreaId[growAreaId] || this.props.growsectionsByGrowAreaId[growAreaId].length === 0) : this.props.growsections.length === 0)) {
      this._onRefresh();
    }
  }

  componentDidDisappear() {
    this.visible = false;
  }


  _onRefresh = () => {
    this.setState({ refreshing: true, searching: false, filterKey: '' });
    Promise.resolve(this.props.onGetGrowSections(this.growAreaId)).then(() => {
      this.setState({ refreshing: false });
    });
  }

  shouldComponentUpdate(nextProps, nextState) {
    return (this.visible);
  }

  onListItemClickHandler = growSection => {
    Navigation.push(this.props.componentId, {
      component: {
        name: 'DevicesScreen',
        passProps: {
          selectedGrowSection: {
            id: growSection.id,
            name: growSection.grow_section_name
          },
          selectedGrowArea: this.props.selectedGrowArea,
          selectedContainer: this.props.selectedContainer,
          selectedFacility: this.props.selectedFacility
        },
        options: {
          topBar: {
            title: {
              text: growSection.grow_section_name
            }
          }
        }
      }
    });
  }

  getListData() {
    let growAreaId = this.growAreaId;
    let data = growAreaId ? this.props.growsectionsByGrowAreaId[growAreaId] : this.props.growsections;
    if (this.state.filterKey) {
      const newData = data.filter(item => {
        const itemData = `${item.grow_section_name.toUpperCase()}`;
        return itemData.indexOf(this.state.filterKey.toUpperCase()) > -1;
      });
      return newData;
    }
    console.log(JSON.stringify(data));
    return data;
  }

  onClearSearch = () => {
    this.setState({
      searching: false,
      filterKey: ''
    })
  }

  render() {
    console.log("Rendering growSections");
    let growAreaId = this.growAreaId;
    let listData = this.getListData() || [];

    let growSectionsList = (
      <FlatList
        data={listData}
        renderItem={(info) => (
          <TouchableOpacity onPress={() => this.onListItemClickHandler(info.item)}>
            <View style={(info.index === listData.length - 1) ? [styles.listItem, {
              borderBottomWidth: 2
            }] : styles.listItem}>
              <Text>{debug ? info.item.id + '-' : ''}{info.item.grow_section_name}</Text>
            </View>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl
            refreshing={this.state.refreshing}
            onRefresh={this._onRefresh}
            colors={['red', 'green', 'blue']}
          />
        }
      />
    );

    if (this.props.isLoading) {
      growSectionsList = <View style={styles.activityIndicator}><ActivityIndicator size="large" color={Constant.PRIMARY_COLOR} /></View>;
    } else if (listData.length === 0) {
      growSectionsList = (
        <ScrollView contentContainerStyle={styles.activityIndicator}
          refreshControl={
            <RefreshControl
              refreshing={this.state.refreshing}
              onRefresh={this._onRefresh}
              colors={['red', 'green', 'blue']}
            />
          }>
          <Text color="#00ff00">No grow sections found.</Text>
        </ScrollView>
      );
    }

    return (
      <View style={styles.container}>
        <View style={styles.greenBackgroundContainer} />
        <View style={styles.listContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[styles.listTitle, { flex: 1 }]}> Grow Sections</Text>
            {!this.state.searching && listData.length > 0 &&
              <Icon name="search" size={24} style={{ padding: 10 }} onPress={() => {
                this.setState({
                  searching: true
                });
                var myInterval = setInterval(() => {
                  if (this.search) {
                    this.search.focus();
                    clearInterval(myInterval);
                  }
                }, 100);
              }} />
            }
          </View>
          {this.state.searching &&
            <SearchBar
              ref={search => this.search = search}
              value={this.state.filterKey}
              lightTheme
              onChangeText={(filterKey) => this.setState({ filterKey })}
              onClear={() => this.onClearSearch()}
              placeholder='Search grow section...'
              containerStyle={{ backgroundColor: Constant.LIGHT_GREY_COLOR, padding: 2 }}
              inputContainerStyle={{ backgroundColor: Constant.WHITE_BACKGROUND_COLOR }}
              inputStyle={{ fontSize: 16 }} />
          }
          {growSectionsList}
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: Constant.LIGHT_GREY_COLOR
  },
  greenBackgroundContainer: {
    backgroundColor: Constant.PRIMARY_COLOR,
    width: '100%',
    height: '25%',
    position: 'absolute'
  },
  listContainer: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: Constant.WHITE_BACKGROUND_COLOR,
    marginLeft: '5%',
    marginRight: '5%',
    borderRadius: 5
  },
  listTitle: {
    padding: 10,
    fontWeight: 'bold',
    borderBottomColor: Constant.LIGHT_GREY_COLOR
  },
  listItem: {
    width: "100%",
    borderTopWidth: 2,
    borderColor: Constant.LIGHT_GREY_COLOR,
    padding: 10,
    flexDirection: "row",
    alignItems: "center"
  },
  activityIndicator: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  }
});

mapStatesToProps = state => {
  return {
    growsections: state.root.growsections,
    growsectionsByGrowAreaId: state.root.growsectionsByGrowAreaId,
    isLoading: state.ui.isLoading
  }
};

mapDispatchToProps = dispatch => {
  return {
    onGetGrowSections: (growAreaId) => dispatch(getGrowSections(growAreaId))
  }
};

export default connect(mapStatesToProps, mapDispatchToProps)(GrowSections);