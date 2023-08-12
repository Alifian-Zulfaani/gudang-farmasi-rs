import { useState, forwardRef, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import Box from "@mui/system/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Grid from "@mui/material/Grid";
import Chip from "@mui/material/Chip";
import visuallyHidden from "@mui/utils/visuallyHidden";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import PlusIcon from "@material-ui/icons/Add";
import DeleteIcon from "@material-ui/icons/Delete";
import NextIcon from "@material-ui/icons/NavigateNext";
import PrevIcon from "@material-ui/icons/NavigateBefore";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Paper from "@mui/material/Paper";
import TableContainer from "@mui/material/TableContainer";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableSortLabel from "@mui/material/TableSortLabel";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@material-ui/icons/SearchOutlined";
import RefreshIcon from "@material-ui/icons/CachedOutlined";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import SpinnerMui from "components/SpinnerMui";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Slide from "@mui/material/Slide";
import st from "styles/module/components/Table.module.scss";
import useClientPermission from "custom-hooks/useClientPermission";
import SelectAsync from "components/SelectAsync";
import { getListOptionPoliklinik } from "api/poliklinik";
import { getListOptionDoctor } from "api/doctor";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers//LocalizationProvider";
import { DesktopDatePicker } from "@mui/x-date-pickers/DesktopDatePicker";
import { formatIsoToGen } from "utils/formatTime";

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const TableLayout = ({
  baseRoutePath = "/",
  customCreatePath = null,
  title = "Default title",
  isBtnAdd = true,
  customBtnAddTitle = null,
  tableHead = [],
  data = [],
  meta = {},
  dataPerPage = 8,
  isUpdatingData,
  filterOptions = [{ label: "Def label", value: "def_value" }],
  updateDataPerPage = () => {},
  updateDataNavigate = () => {},
  refreshData = () => {},
  deleteData = () => {},
  searchData = () => {},
}) => {
  const router = useRouter();
  const [order, setOrder] = useState("asc");
  const [orderBy, setOrderBy] = useState(tableHead[0].id);
  const [page] = useState(0);
  const [confirmationDelete, setConfirmationDelete] = useState({
    state: false,
    data: {},
  });
  const [searchText, setSearchText] = useState("");
  const { clientPermission } = useClientPermission();
  const [filter, setFilter] = useState(filterOptions[0].value);
  const [selectedFilter, setSelectedFilter] = useState([]);
  const textFieldCategory = ["no_rm", "email", "name", "address"];
  const [poliRef, setPoliRef] = useState({
    values: {
      id: "",
      name: "",
    },
    touched: false,
    errors: false,
  });
  const [doctorRef, setDoctorRef] = useState({
    values: {
      DR_ID: "",
      NAME: "",
    },
    touched: false,
    errors: false,
  });
  const [date, setDate] = useState(null);

  // BOILER-PLATE START
  // --start table operator stuff
  function descendingComparator(a, b, orderBy) {
    if (b[orderBy] < a[orderBy]) {
      return -1;
    }
    if (b[orderBy] > a[orderBy]) {
      return 1;
    }
    return 0;
  }
  function getComparator(order, orderBy) {
    return order === "desc"
      ? (a, b) => descendingComparator(a, b, orderBy)
      : (a, b) => -descendingComparator(a, b, orderBy);
  }
  // This method is created for cross-browser compatibility, if you don't
  // need to support IE11, you can use Array.prototype.sort() directly
  function stableSort(array, comparator) {
    const stabilizedThis = array.map((el, index) => [el, index]);
    stabilizedThis.sort((a, b) => {
      const order = comparator(a[0], b[0]);
      if (order !== 0) {
        return order;
      }
      return a[1] - b[1];
    });
    return stabilizedThis.map((el) => el[0]);
  }
  function EnhancedTableHead(props) {
    const { order, orderBy, onRequestSort } = props;
    const createSortHandler = (property) => (event) => {
      onRequestSort(event, property);
    };

    return (
      <TableHead>
        <TableRow>
          {tableHead.map((headCell, idx) => (
            <TableCell
              key={headCell.id}
              align="left"
              sortDirection={orderBy === headCell.id ? order : false}
              sx={{ paddingLeft: idx === 0 ? 1 : 0 }}
            >
              <TableSortLabel
                active={orderBy === headCell.id}
                direction={orderBy === headCell.id ? order : "asc"}
                onClick={createSortHandler(headCell.id)}
                className="font-w-600"
              >
                {headCell.label}
                {orderBy === headCell.id ? (
                  <Box component="span" sx={visuallyHidden}>
                    {order === "desc"
                      ? "sorted descending"
                      : "sorted ascending"}
                  </Box>
                ) : null}
              </TableSortLabel>
            </TableCell>
          ))}
          <TableCell align="right" padding="normal" />
        </TableRow>
      </TableHead>
    );
  }
  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };
  // Avoid a layout jump when reaching the last page with empty rows.
  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * dataPerPage - data.length) : 0;
  // --end table operator stuff
  // BOILER-PLATE END

  const handleOpenConfirmationDelete = (payload) => {
    setConfirmationDelete({
      state: true,
      data: payload,
    });
  };

  const handleCloseConfirmationDelete = () => {
    setConfirmationDelete((prev) => ({
      ...prev,
      state: false,
    }));
  };

  const handleContinueConfirmationDelete = () => {
    deleteData(confirmationDelete.data.id);
    handleCloseConfirmationDelete();
  };

  const handleNavigate = (payload) => {
    updateDataNavigate(payload);
  };

  const handleRefresh = () => {
    setSearchText("");
    setPoliRef((e) => ({
      ...e,
      values: {
        id: "",
        name: "",
      },
    }));
    setDoctorRef((e) => ({
      ...e,
      values: {
        DR_ID: "",
        NAME: "",
      },
    }));
    setDate(null);
    setFilter(filterOptions[0].value);
    setSelectedFilter([]);
    refreshData();
  };

  const isPermitted = (payload) => {
    let value = true;
    if (clientPermission.includes("admin")) return value;
    if (
      !clientPermission.includes(`${baseRoutePath.substring(1)}:${payload}`)
    ) {
      value = false;
    }
    return value;
  };

  const handleChangeFilter = (event) => {
    setSearchText("");
    setPoliRef((e) => ({
      ...e,
      values: {
        id: "",
        name: "",
      },
    }));
    setDoctorRef((e) => ({
      ...e,
      values: {
        DR_ID: "",
        NAME: "",
      },
    }));
    setDate(null);
    setFilter(event.target.value);
  };

  const handleOnEnterSearch = () => {
    if (!searchText.replace(/\s/g, "").length) {
      setSearchText("");
      return;
    }
    let tempOptions = filterOptions.filter((e) => e.value === filter);
    let tempFilterDisplay = [...selectedFilter];
    tempFilterDisplay = tempFilterDisplay.filter((e) => e.type !== filter);
    tempFilterDisplay.unshift({
      type: filter,
      label: tempOptions[0].label,
      value: searchText,
    });
    setSearchText("");
    setSelectedFilter(tempFilterDisplay);
    searchData(tempFilterDisplay);
  };

  const handleDeleteDisplayFilter = (data) => {
    let tempData = [...selectedFilter];
    tempData = tempData.filter((e) => e.type !== data.type);
    setFilter(data.type);
    setSelectedFilter(tempData);
    searchData(tempData);
  };

  const handleOnChangePoli = (value) => {
    if (value) {
      setPoliRef((e) => ({
        ...e,
        values: {
          ...value,
        },
      }));
      let tempOptions = filterOptions.filter((e) => e.value === filter);
      let tempFilterDisplay = [...selectedFilter];
      tempFilterDisplay = tempFilterDisplay.filter((e) => e.type !== filter);
      tempFilterDisplay.unshift({
        type: filter,
        label: tempOptions[0].label,
        value: value.name,
      });
      setSelectedFilter(tempFilterDisplay);
      searchData(tempFilterDisplay);
    } else {
      setPoliRef((e) => ({
        ...e,
        values: {
          id: "",
          name: "",
        },
      }));
    }
  };

  const handleOnChangeDoctor = (value) => {
    if (value) {
      setDoctorRef((e) => ({
        ...e,
        values: {
          ...value,
        },
      }));
      let tempOptions = filterOptions.filter((e) => e.value === filter);
      let tempFilterDisplay = [...selectedFilter];
      tempFilterDisplay = tempFilterDisplay.filter((e) => e.type !== filter);
      tempFilterDisplay.unshift({
        type: filter,
        label: tempOptions[0].label,
        value: value.NAME,
      });
      setSelectedFilter(tempFilterDisplay);
      searchData(tempFilterDisplay);
    } else {
      setDoctorRef((e) => ({
        ...e,
        values: {
          DR_ID: "",
          NAME: "",
        },
      }));
    }
  };

  const handleChangeDate = (newValue) => {
    setDate(newValue);
    // note: before send date
    // let data = {
    //   datetime_medis: formatIsoToGen(date) || null
    // };
    let tempOptions = filterOptions.filter((e) => e.value === filter);
    let tempFilterDisplay = [...selectedFilter];
    tempFilterDisplay = tempFilterDisplay.filter((e) => e.type !== filter);
    tempFilterDisplay.unshift({
      type: filter,
      label: tempOptions[0].label,
      value: formatIsoToGen(newValue),
    });
    setSelectedFilter(tempFilterDisplay);
    searchData(tempFilterDisplay);
  };

  const RenderFieldFilter = (
    <>
      {textFieldCategory.includes(filter) ? (
        <TextField
          id={`search-${title}`}
          label={`Cari ${title}`}
          sx={{ width: "100%" }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyDownCapture={(e) => {
            if (e.key === "Enter") {
              handleOnEnterSearch();
            }
          }}
        />
      ) : null}
      {filter === "poli" ? (
        <SelectAsync
          id="poli"
          labelField="Poliklinik"
          labelOptionRef="name"
          valueOptionRef="id"
          handlerRef={poliRef}
          handlerFetchData={getListOptionPoliklinik}
          handlerOnChange={(value) => handleOnChangePoli(value)}
        />
      ) : null}
      {filter === "doctor" ? (
        <SelectAsync
          id="doctor"
          labelField="Dokter"
          labelOptionRef="NAME"
          valueOptionRef="DR_ID"
          handlerRef={doctorRef}
          handlerFetchData={getListOptionDoctor}
          handlerOnChange={(value) => handleOnChangeDoctor(value)}
        />
      ) : null}
      {filter === "date" ? (
        <FormControl fullWidth>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DesktopDatePicker
              label="Tanggal"
              inputFormat="dd/MM/yyyy"
              value={date}
              onChange={handleChangeDate}
              renderInput={(params) => <TextField {...params} />}
            />
          </LocalizationProvider>
        </FormControl>
      ) : null}
    </>
  );

  return (
    <>
      <div className={st.container}>
        <div className={st.header}>
          <h2 className="color-grey-text">{title}</h2>
          {isBtnAdd ? (
            <Button
              variant="contained"
              endIcon={<PlusIcon />}
              disabled={!isPermitted("store")}
              onClick={
                !customCreatePath
                  ? () => router.push(`${baseRoutePath}/create`)
                  : () => router.push(customCreatePath)
              }
            >
              {customBtnAddTitle ? <>{customBtnAddTitle}</> : <>{title} Baru</>}
            </Button>
          ) : null}
        </div>
        <Box sx={{ width: "100%", marginY: 4 }}>
          <Paper sx={{ width: "100%", padding: 2 }}>
            <Grid container spacing={1} alignItems={"center"}>
              <Grid item md={2} xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="filter-select-label">Filter</InputLabel>
                  <Select
                    labelId="filter-select-label"
                    id="filter-select"
                    value={filter}
                    label="Filter"
                    onChange={handleChangeFilter}
                  >
                    {filterOptions.map((e) => (
                      <MenuItem key={e.value} value={e.value}>
                        {e.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item md={8} xs={10}>
                {RenderFieldFilter}
              </Grid>
              <Grid item md={2} xs={2}>
                <div className="flex justify-end">
                  <Tooltip title="Refresh Data" arrow>
                    <span>
                      <IconButton
                        onClick={isUpdatingData ? null : handleRefresh}
                      >
                        <RefreshIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                </div>
              </Grid>
            </Grid>
            <div className="flex mt-8">
              {selectedFilter.map((data) => {
                return (
                  <div key={data.type} className="mr-4">
                    <Chip
                      label={data.label + ": " + data.value}
                      onDelete={() => handleDeleteDisplayFilter(data)}
                    ></Chip>
                  </div>
                );
              })}
            </div>
            <div>
              {isUpdatingData ? (
                <div
                  className="flex justify-center items-center"
                  style={{ height: "200px" }}
                >
                  <SpinnerMui />
                </div>
              ) : data.length !== 0 ? (
                <>
                  <TableContainer>
                    <Table
                      sx={{ minWidth: 750 }}
                      aria-labelledby={`table${title}`}
                    >
                      <EnhancedTableHead
                        order={order}
                        orderBy={orderBy}
                        onRequestSort={handleRequestSort}
                      />
                      <TableBody>
                        {stableSort(data, getComparator(order, orderBy))
                          .slice(
                            page * dataPerPage,
                            page * dataPerPage + dataPerPage
                          )
                          .map((row, idR) => {
                            return (
                              <TableRow
                                hover
                                tabIndex={-1}
                                key={row.id || idR}
                                onDoubleClick={
                                  row.id && isPermitted("show")
                                    ? () =>
                                        router.push(
                                          `${baseRoutePath}/${row.id}`
                                        )
                                    : null
                                }
                                className="pointer"
                              >
                                {Object.keys(row).map((obKey, idx) => {
                                  // hide id
                                  if (obKey === "id") return;
                                  return (
                                    <TableCell
                                      key={idx}
                                      align="left"
                                      padding="none"
                                      sx={{
                                        paddingLeft: idx === 0 ? 1 : 0,
                                        paddingRight: 2,
                                      }}
                                    >
                                      {row[obKey]}
                                    </TableCell>
                                  );
                                })}
                                <TableCell
                                  align="right"
                                  padding="none"
                                  sx={{
                                    paddingRight: 1,
                                    paddingY: 0.8,
                                  }}
                                >
                                  {isPermitted("destroy") ? (
                                    <Tooltip title="Delete" arrow>
                                      <IconButton
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          handleOpenConfirmationDelete(row);
                                        }}
                                      >
                                        <DeleteIcon color="error" />
                                      </IconButton>
                                    </Tooltip>
                                  ) : (
                                    <Tooltip title="You don't have permission to do this">
                                      <span>
                                        <IconButton disabled>
                                          <DeleteIcon />
                                        </IconButton>
                                      </span>
                                    </Tooltip>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}

                        {emptyRows > 0 && (
                          <TableRow
                            style={{
                              height: (dense ? 33 : 53) * emptyRows,
                            }}
                          >
                            <TableCell colSpan={6} />
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <div className="flex justify-end items-center pt-16 pb-8">
                    <div>
                      <span className="font-16 mr-16">Rows per page</span>
                      <Select
                        labelId="select-row-per-page"
                        id="select-row-per-page"
                        onChange={(val) =>
                          updateDataPerPage(val, selectedFilter)
                        }
                        value={dataPerPage}
                      >
                        <MenuItem value={8}>8</MenuItem>
                        <MenuItem value={16}>16</MenuItem>
                        <MenuItem value={24}>24</MenuItem>
                        <MenuItem value={34}>34</MenuItem>
                      </Select>
                    </div>
                    <div>
                      <Tooltip title="Previous" arrow>
                        <span>
                          <IconButton
                            disabled={meta.prev_page === null}
                            onClick={
                              meta.prev_page !== null
                                ? () => handleNavigate(meta.prev_page)
                                : null
                            }
                          >
                            <PrevIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Next" arrow>
                        <span>
                          <IconButton
                            disabled={meta.next_page === null}
                            onClick={
                              meta.next_page !== null
                                ? () => handleNavigate(meta.next_page)
                                : null
                            }
                          >
                            <NextIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: "center", margin: "12 0" }}>
                  No data found
                </div>
              )}
            </div>
          </Paper>
        </Box>
      </div>
      <Dialog
        open={confirmationDelete.state}
        onClose={handleCloseConfirmationDelete}
        TransitionComponent={Transition}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {`Hapus data ${title} berikut?`}
        </DialogTitle>
        <DialogContent>
          {Object.keys(confirmationDelete.data).map((obKey, idx) => {
            // hide id and static number
            if (obKey === "id" || obKey === "no") return;
            else
              return (
                <DialogContentText key={idx}>
                  {tableHead[idx].label}: {confirmationDelete.data[obKey]}
                </DialogContentText>
              );
          })}
        </DialogContent>
        <DialogActions>
          <Button color="error" onClick={handleCloseConfirmationDelete}>
            Batal
          </Button>
          <Button color="success" onClick={handleContinueConfirmationDelete}>
            Lanjutkan
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TableLayout;
